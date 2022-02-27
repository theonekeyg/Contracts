const CrodoPrivateSale = artifacts.require("CrodoPrivateSale")
const TestToken = artifacts.require("TestToken")
const BigNumber = require("bignumber.js")

function amountToLamports (amount, decimals) {
    return new BigNumber(amount).multipliedBy(10 ** decimals).integerValue()
}

contract("PrivateSale", (accounts) => {
    let crodoToken
    let usdtToken
    let privateSale
    let usdtPrice
    let tokensForSale
    const owner = accounts[0]
    const crodoDecimals = 18
    const usdtDecimals = 6

    beforeEach(async () => {
        crodoToken = await TestToken.new(crodoDecimals, owner, 0)
        usdtToken = await TestToken.new(usdtDecimals, owner, 0)
        usdtPrice = amountToLamports(0.15, usdtDecimals)
        tokensForSale = amountToLamports(100000, crodoDecimals)

        privateSale = await CrodoPrivateSale.new(crodoToken.address, usdtToken.address, usdtPrice)
        await crodoToken.mint(privateSale.address, tokensForSale)
    })

    it("user exceeded their buy limit", async () => {
        const usdtPrice = amountToLamports(0.15 * 50, usdtDecimals)
        await usdtToken.mint(owner, usdtPrice)
        await privateSale.addParticipant(owner, 1, 49)
        await usdtToken.approve(privateSale.address, usdtPrice)

        await privateSale.lockTokens(50).then(res => {
            assert.fail("This shouldn't happen")
        }).catch(desc => {
            assert.equal(desc.reason, "User tried to exceed their buy-high limit")
            // assert.equal(desc.code, -32000)
            // assert.equal(desc.message, "rpc error: code = InvalidArgument desc = execution reverted: User tried to exceed their buy-high limit: invalid request")
        })
    })

    it("user doesn't have enough USDT", async () => {
        const usdtPrice = amountToLamports(0.15 * 10, usdtDecimals)
        // await usdtToken.mint(owner, usdtPrice)
        await privateSale.addParticipant(owner, 1, 100)
        await usdtToken.approve(privateSale.address, usdtPrice)

        await privateSale.lockTokens(10).then(res => {
            assert.fail("This shouldn't happen")
        }).catch(desc => {
            assert.equal(desc.reason, "User doesn't have enough USDT to buy requested tokens")
            // assert.equal(desc.code, -32000)
            // assert.equal(desc.message, "rpc error: code = InvalidArgument desc = execution reverted: User doesn't have enough USDT to buy requested tokens: invalid request")
        })
    })

    it("reserve and release 23 tokens", async () => {
        const lockingAmount = 23;
        const usdtPrice = amountToLamports(0.15 * lockingAmount, usdtDecimals)
        await usdtToken.mint(owner, usdtPrice)
        await privateSale.addParticipant(owner, 1, 100)
        await usdtToken.approve(privateSale.address, usdtPrice)

        const userUSDTBefore = Number(await usdtToken.balanceOf(owner))
        await privateSale.lockTokens(lockingAmount)

        assert.equal(
            Number(amountToLamports(lockingAmount, crodoDecimals)),
            Number(await privateSale.reservedBy(owner))
        )
        assert.equal(
            userUSDTBefore - usdtPrice,
            Number(await usdtToken.balanceOf(owner))
        )

        await privateSale.setReleaseInterval(0);
        await privateSale.close()

        await privateSale.releaseTokens()
        assert.equal(
            Number(amountToLamports(lockingAmount, crodoDecimals)) * 0.1,
            Number(await crodoToken.balanceOf(owner))
        )
        await privateSale.releaseTokens()
        assert.equal(
            Number(amountToLamports(lockingAmount, crodoDecimals)) * 0.2,
            Number(await crodoToken.balanceOf(owner))
        )
    })
})
