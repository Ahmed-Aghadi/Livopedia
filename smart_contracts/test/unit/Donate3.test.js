const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { Web3Storage, File } = require("web3.storage")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Donate3 Unit Tests", function () {
          let donate3, donate3Contract, cid
          const chainId = network.config.chainId
          const { title, description, goal } = networkConfig[chainId]

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              donate3Contract = await ethers.getContract("Donate3")
              donate3 = donate3Contract.connect(user)

              const client = new Web3Storage({ token: process.env.WEB3STORAGE_TOKEN })
              const obj = { title: title, description: description }
              const buffer = Buffer.from(JSON.stringify(obj))
              const files = [new File([buffer], "donate.json")]
              cid = await client.put(files)
          })

          describe("createEntry", function () {
              it("emits an event after creating item", async function () {
                  expect(await donate3.createEntry(cid, goal)).to.emit("EntryCreated")
              })
              describe("DonateEntry", function () {
                  let donateEntryAddress, donateEntryContract

                  beforeEach(async () => {
                      const tx = await donate3.createEntry(cid, goal)
                      const response = await tx.wait()
                      const donateEntryEncodedAddress = response.events[0].data
                      const abi = ["event EntryCreated(address donateEntry, address owner)"]
                      const iface = new ethers.utils.Interface(abi)
                      donateEntryAddress = iface.decodeEventLog(
                          "EntryCreated",
                          donateEntryEncodedAddress
                      )[0]
                      donateEntryContract = await ethers.getContractAt(
                          "DonateEntry",
                          donateEntryAddress,
                          deployer
                      )
                  })

                  it("updates owner as user", async function () {
                      const owner = await donateEntryContract.getOwner()
                      assert(owner == user.address)
                  })

                  describe("fund", function () {
                      const fundAmount = 1
                      const startingIndex = 2
                      const endingIndex = 5
                      let amountFunded, numberOfDonors
                      beforeEach(async function () {
                          for (let i = 2; i <= 5; i++) {
                              const donateEntryConnectedToFunder =
                                  await donateEntryContract.connect(accounts[i])
                              await donateEntryConnectedToFunder.fund({ value: fundAmount })
                          }
                          numberOfDonors = endingIndex - startingIndex + 1
                          amountFunded = numberOfDonors * fundAmount
                      })

                      it("updates balance of DonateEntry contract", async function () {
                          let balance = (
                              await ethers.provider.getBalance(donateEntryAddress)
                          ).toString()
                          assert(balance == amountFunded)
                      })

                      it("updates amount received", async function () {
                          const amountReceived = (
                              await donateEntryContract.getAmountReceived()
                          ).toString()
                          assert(amountFunded == amountReceived)
                      })

                      it("can't fund zero donation", async function () {
                          await expect(donateEntryContract.fund({ value: 0 })).to.be.revertedWith(
                              "ZeroDonation"
                          )
                      })

                      describe("same funder funding multiple times", function () {
                          beforeEach(async function () {
                              for (let i = 2; i <= 5; i++) {
                                  const donateEntryConnectedToFunder =
                                      await donateEntryContract.connect(accounts[i])
                                  await donateEntryConnectedToFunder.fund({ value: fundAmount })
                              }
                              amountFunded += numberOfDonors * fundAmount
                          })

                          it("updates amount received", async function () {
                              const amountReceived = (
                                  await donateEntryContract.getAmountReceived()
                              ).toString()
                              assert(amountFunded == amountReceived)
                          })
                      })
                  })

                  describe("withdraw", function () {
                      const fundAmount = 1
                      const startingIndex = 2
                      const endingIndex = 5
                      let amountFunded, numberOfDonors
                      beforeEach(async function () {
                          for (let i = 2; i <= 5; i++) {
                              const donateEntryConnectedToFunder =
                                  await donateEntryContract.connect(accounts[i])
                              await donateEntryConnectedToFunder.fund({ value: fundAmount })
                          }
                          numberOfDonors = endingIndex - startingIndex + 1
                          amountFunded = numberOfDonors * fundAmount
                      })

                      it("only owner can withdraw", async function () {
                          await expect(donateEntryContract.withdraw()).to.be.revertedWith(
                              "NotOwner"
                          )
                          let balance = (
                              await ethers.provider.getBalance(donateEntryAddress)
                          ).toString()
                          assert(balance == amountFunded)
                          const amountReceived = await donateEntryContract.getAmountReceived()
                          const userStartingBalance = await ethers.provider.getBalance(user.address)
                          const txResponse = await donateEntryContract.connect(user).withdraw()
                          const transactionReceipt = await txResponse.wait(1)
                          const { gasUsed, effectiveGasPrice } = transactionReceipt
                          const gasCost = gasUsed.mul(effectiveGasPrice)
                          const userEndingBalance = await ethers.provider.getBalance(user.address)
                          assert(
                              userEndingBalance.add(gasCost).toString() ==
                                  userStartingBalance.add(amountReceived.toString())
                          )
                          balance = await ethers.provider.getBalance(donateEntryAddress)
                          assert(balance == 0)
                      })
                  })
              })
          })
      })
