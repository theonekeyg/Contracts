const DistributionContract = artifacts.require("CrodoDistributionContract")
const CrodoToken = artifacts.require("CrodoToken")
const BigNumber = require("bignumber.js")

contract("CrodoToken", (accounts) => {
    let token
    let dist
    const owner = accounts[0]
    const recipient = accounts[1]

    beforeEach(async () => {
        dist = await DistributionContract.new()
        token = await CrodoToken.new(dist.address)
        await dist.setTokenAddress(token.address)
        // Set release time to yesterday
        await dist.setTGEDate(Math.floor(Date.now() / 1000) - (3600 * 24))
    })

    it("test basic attributes of the Crodo token", async () => {
        let tokenCap = new BigNumber(100000000).multipliedBy(1e+18)
        assert.equal(await token.name(), "CrodoToken")
        assert.equal(await token.symbol(), "CROD")
        assert.equal(await token.decimals(), 18)
        assert.equal(
            new BigNumber(await token.cap()).toString(),
            tokenCap.toString()
        )
    })

    it("test immediate mint according to distribution policy", async () => {
        await dist.triggerTokenSend();

        let immediateMint =
            new BigNumber(
                1000000 + // Seed round
                1200000 // Private round
                // 400000 + // Public round
                // 20000000 + // Liquidity round
                // 10000000 // Other round
            ).multipliedBy(1e+18)
        let immediateReceiver = "0xA4399b7C8a6790c0c9174a68f512D10A791664e1"
        let minted = Number(await token.balanceOf(immediateReceiver))

        assert.equal(
            immediateMint,
            minted
        )

        assert.equal(
            Number(await token.balanceOf(dist.address)),
            new BigNumber(await token.cap()).minus(minted)
        )
    })

    it("transfer instruction emits Transfer event", async () => {
        // const mintAmount = 100
        // const transferAmount = 50
        // await token.mint(owner, mintAmount)
        // const { logs } = await token.transfer(recipient, transferAmount)
        // const event = logs.find(e => e.event === "Transfer")
        // assert.notEqual(event, undefined)
    })
})
