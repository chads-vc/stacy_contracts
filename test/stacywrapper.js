const { expect } = require("chai");
const { ethers } = require("hardhat");
const hardhat = require("hardhat");
const BigNumber = require('bignumber.js');

describe("StacyWrapper", function() {

    let res;
    let stacyOwner;
    let otherAddress;
    let stacyWrapper;
    let stacy;
    let uniswapPair;
    let chads;

    const STACY_DEPLOYER = "0x8aEf57fe9d16BE8F24df37ab56da6eC18f7e9a08";
    const CHADS_ADDRESS = "0x69692D3345010a207b759a7D1af6fc7F38b35c5E";

    before(async function () {        
        [otherAddress] = await ethers.getSigners();

        res = await hardhat.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [STACY_DEPLOYER]}
        )
        stacyOwner = await ethers.provider.getSigner(STACY_DEPLOYER);

        //Deploy Wrapper contract
        var StacyWrapper = await ethers.getContractFactory('StacyCherryPopWrapper');
        StacyWrapper = await StacyWrapper.connect(stacyOwner);
        stacyWrapper = await StacyWrapper.deploy("0xf12EC0D3Dab64DdEfBdC96474bDe25af3FE1B327", "0xdfcc12a0aad50d84639d558551edd7a523b69ac5");
        console.log("Address:", stacyWrapper.address);

        stacy = await ethers.getContractAt('Stacy', "0xf12EC0D3Dab64DdEfBdC96474bDe25af3FE1B327")
        stacy = await stacy.connect(stacyOwner);

        uniswapPair = await ethers.getContractAt('@uniswap\\v2-core\\contracts\\interfaces\\IUniswapV2Pair.sol:IUniswapV2Pair', '0xdfcc12a0aad50d84639d558551edd7a523b69ac5');
        await stacy.transferOwnership(stacyWrapper.address);
        
        chads = await ethers.getContractAt('contracts\\FeeApprover.sol:IERC20', CHADS_ADDRESS);
        chads = await chads.connect(stacyOwner);
        // transfer ~100,000 chads (minus burn) to stacyWrapper so it can pop the cherry
        await chads.transfer(stacyWrapper.address, ethers.BigNumber.from(10).pow(23));
    });

    it("should impersonate account", function () {
        expect(res).to.be.true;
    });

    it("wrapper contract owns stacy", async function () {
        const _stacyOwner = await stacy.owner();
        expect(_stacyOwner).to.equal(stacyWrapper.address);
    });

    describe("Access control works properly", function () {
        it("should be owned by stacy deployer", async function () {
            const wrapperOwner = await stacyWrapper.owner();
            expect(wrapperOwner).to.equal(STACY_DEPLOYER);
        })

        it("should not allow access from nonowner account to protected functions", async function () {
            stacyWrapper = await stacyWrapper.connect(otherAddress);

            await expect(stacyWrapper.correctStacySupply(1000)).to.be.reverted;
            await expect(stacyWrapper.renounceSTACYOwnership()).to.be.reverted;
            await expect(stacyWrapper.transferSTACYOwnership(otherAddress)).to.be.reverted;
            await expect(stacyWrapper.setSTACYBurnCherryPopRewards(true)).to.be.reverted;
            await expect(stacyWrapper.setSTACYCherryPopBurnCallerRewardPct(2)).to.be.reverted;
            await expect(stacyWrapper.setSTACYCherryPopBurnPct(2)).to.be.reverted;
            await expect(stacyWrapper.setSTACYFeeDistributor(otherAddress)).to.be.reverted;
            await expect(stacyWrapper.setSTACYShouldTransferChecker(otherAddress)).to.be.reverted;
        })

        it("should allow transfer of STACY ownership", async function () {
            stacyWrapper = await stacyWrapper.connect(stacyOwner);
            await expect(stacy.transferOwnership(STACY_DEPLOYER)).to.be.reverted;

            await stacyWrapper.transferSTACYOwnership(STACY_DEPLOYER);
            let _stacyOwner = await stacy.owner();
            expect(_stacyOwner).to.equal(STACY_DEPLOYER);

            await stacy.transferOwnership(stacyWrapper.address);
            _stacyOwner = await stacy.owner();
            expect(_stacyOwner).to.equal(stacyWrapper.address);            
        })        
    });


    describe("cherry pop works correctly", function () {
        let uniswapWETHReserve;
        let uniswapStacyReserve;
        let stacyAddressBalance;
        let stacyUniswapBalance;
        let wrapperStacyBalance;
        let otherAddressStacyBalance;

        it ("shound correctly lock tokens when correcting stacy supply", async function () {
            stacyWrapper = await stacyWrapper.connect(stacyOwner);

            stacyAddressBalance = await stacy.balanceOf(stacy.address);
            stacyUniswapBalance = await stacy.balanceOf(uniswapPair.address);
            [uniswapWETHReserve, uniswapStacyReserve, _] = await uniswapPair.getReserves();

            await stacyWrapper.correctStacySupply(1000000000);
            expect(await stacy.balanceOf(stacy.address)).to.equal(stacyAddressBalance.add(1000000000));
            expect(await stacy.balanceOf(uniswapPair.address)).to.equal(stacyUniswapBalance.sub(1000000000));
            expect(await stacyWrapper.totalLocked()).to.equal(1000000000);
        });

        it ("should sync reserve balances properly", async function () {
            let [uniswapWETHReserveAfter, uniswapStacyReserveAfter, _] = await uniswapPair.getReserves();

            expect(uniswapWETHReserveAfter).to.equal(uniswapWETHReserve);
            expect(uniswapStacyReserveAfter).to.equal(uniswapStacyReserve.sub(1000000000));
        });

        it ("should correctly adjust uniswap STACY supply on cherry pop", async function () {
            stacyWrapper = await stacyWrapper.connect(stacyOwner);

            stacyAddressBalance = await stacy.balanceOf(stacy.address);
            stacyUniswapBalance = await stacy.balanceOf(uniswapPair.address);
            [uniswapWETHReserve, uniswapStacyReserve, _] = await uniswapPair.getReserves();

            const popCherryAmount = await stacy.getCherryPopAmount();
            await stacyWrapper.cherryPop();

            expect(await stacy.balanceOf(stacy.address)).to.be.gt(stacyAddressBalance);
            // use lte because amount is slightly lower due to block.timestamp in cherryPop function call being one greater than when checking popcherryamount in test
            expect(await stacy.balanceOf(uniswapPair.address)).to.be.lte(stacyUniswapBalance.sub(popCherryAmount));
            expect(await stacyWrapper.totalLocked()).to.be.gt(1000000000);           
        });

        it ("should sync uniswap reserves on cherry pop properly", async function () {
            let [uniswapWETHReserveAfter, uniswapStacyReserveAfter, _] = await uniswapPair.getReserves();

            expect(uniswapWETHReserveAfter).to.equal(uniswapWETHReserve);
            expect(await stacy.balanceOf(uniswapPair.address)).to.equal(uniswapStacyReserveAfter);        
        });

        it ("should not let an address without at least 10,000 CHADS pop the cherry", async function () {
            stacyWrapper = await stacyWrapper.connect(otherAddress);

            await expect(stacyWrapper.cherryPop()).to.be.reverted;
        });

        it ("should let an address with at least 10,000 CHADS pop the cherry", async function () {
            wrapperStacyBalance = await stacy.balanceOf(stacyWrapper.address);
            otherAddressStacyBalance = await stacy.balanceOf(otherAddress.address);
            await chads.transfer(otherAddress.address, ethers.BigNumber.from(10).pow(23));
            await expect(stacyWrapper.cherryPop()).to.not.be.reverted;
        });

        it ("Should transfer user reward to pop cherry caller", async function () {
            expect(await stacy.balanceOf(stacyWrapper.address)).to.equal(0);
            expect(await stacy.balanceOf(otherAddress.address)).to.be.gt(otherAddressStacyBalance);
        });
    });
});