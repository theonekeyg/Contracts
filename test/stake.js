const TestToken = artifacts.require("TestToken")
const CRDStake = artifacts.require("CRDStake")
const BigNumber = require("bignumber.js")

function amountToLamports (amount, decimals) {
    return new BigNumber(amount).multipliedBy(10 ** decimals).integerValue()
}

contract("CrodoToken", (accounts) => {
    let crodoToken
    let stakeToken
    let stake
    const owner = accounts[0]

    const day = 60 * 60 * 24
    const month = day * 30
    const year = month * 12

    const lockTimePeriodMin = month
    const lockTimePeriodMax = 2 * year
    const crodoDecimals = 18
    const stakeDecimals = 12

    beforeEach(async () => {
        crodoToken = await TestToken.new(crodoDecimals, owner, 0)
        stakeToken = await TestToken.new(stakeDecimals, owner, 0)
        stake = await CRDStake.new(stakeToken.address, lockTimePeriodMin, lockTimePeriodMax)
        await stake.setRewardToken(crodoToken.address)
        await stakeToken.mint(stake.address, amountToLamports(100000, crodoDecimals))
    })

    it("stake 10 tokens for 6 months & withdraw them", async () => {
        const stakeAmount = amountToLamports(10, crodoDecimals)
        const lockTime = 6 * month

        await stakeToken.mint(owner, stakeAmount)
        await stakeToken.approve(stake.address, stakeAmount)
        await stake.stake(stakeAmount, lockTime)

        assert.equal(
            lockTime,
            Number(await stake.getLockTime(owner))
        )
        assert.equal(
            stakeAmount,
            Number(await stake.stakeAmount(owner))
        )

        // const userBalanceBefore = Number(await stakeToken.balanceOf(owner))
        // const contractBalanceBefore = Number(await stakeToken.balanceOf(stake.address))
    })

    it("user tried to exceed the max stake time limit", async () => {
        const stakeAmount = amountToLamports(10, crodoDecimals)
        const lockTime = lockTimePeriodMax + month

        await stakeToken.mint(owner, stakeAmount)
        await stakeToken.approve(stake.address, stakeAmount)
        await stake.stake(stakeAmount, lockTime).then(res => {
            assert.fail("This shouldn't happen")
        }).catch(desc => {
            assert.equal(desc.reason, "lockTime must by < lockTimePeriodMax")
            // assert.equal(desc.code, -32000)
            // assert.equal(desc.message, "rpc error: code = InvalidArgument desc = execution reverted: : invalid request")
        })
    })
})
