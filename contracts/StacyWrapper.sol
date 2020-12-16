
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';

pragma solidity ^0.6.0;

interface IStacy {
    function lock(address _holder, uint256 _amount) external;
    function cherryPop() external;

    function renounceOwnership() external;
    function transferOwnership(address newOwner) external;

    function setFeeDistributor(address _feeDistributor) external;
    function setShouldTransferChecker(address _transferCheckerAddress) external;

    function burnCherryPopRewards() external view returns (bool);
    function setBurnCherryPopRewards(bool _burnCherryPopRewards) external;    
    function totalPopped() external view returns (uint256);
    function cherryPopBurnCallerRewardPct() external view returns (uint256);
    function setCherryPopBurnCallerRewardPct(uint _cherryPopBurnCallerRewardPct) external;
    function setCherryPopBurnPct(uint _cherryPopBurnPct) external;

    function getCherryPopAmount() external view returns (uint256);
}

contract StacyCherryPopWrapper is Ownable {  
    using SafeMath for uint256;

    IStacy stacy;
    address uniswapPair;

    uint256 public totalLocked;

    constructor(address stacyAddress, address stacyEthPair) public {
        stacy = IStacy(stacyAddress);
        uniswapPair = stacyEthPair;
    }

    function correctStacySupply(uint256 _amount) external onlyOwner {
        require(totalLocked.add(_amount) <= stacy.totalPopped(), "can't burn more STACY than was popped");
        _lockUniswap(_amount);  
        totalLocked = totalLocked.add(_amount);
    }

    function cherryPop() external {
        uint256 cherryPopFeeDistributionAmount = stacy.getCherryPopAmount();

        stacy.cherryPop();
        uint256 userReward = cherryPopFeeDistributionAmount.mul(stacy.cherryPopBurnCallerRewardPct()).div(100);
        cherryPopFeeDistributionAmount = cherryPopFeeDistributionAmount.sub(userReward);

        if (!stacy.burnCherryPopRewards()) {
            _lockUniswap(cherryPopFeeDistributionAmount);
        }

        totalLocked = totalLocked.add(cherryPopFeeDistributionAmount); // this is still counted in totalPopped in STACY contract even if its burned, so we account it here also
    }

    function _lockUniswap(uint256 _amount) internal {
        stacy.lock(uniswapPair, _amount);
        IUniswapV2Pair(uniswapPair).sync();
    }   

    // wrapper functions for owner-specific functions on STACY contract
    function renounceSTACYOwnership() external onlyOwner {
        stacy.renounceOwnership();
    }

    function transferSTACYOwnership(address newOwner) external onlyOwner {
        stacy.transferOwnership(newOwner);
    }


    function setSTACYBurnCherryPopRewards(bool _burnCherryPopRewards) external onlyOwner {
        stacy.setBurnCherryPopRewards(_burnCherryPopRewards);
    }    

    function setSTACYCherryPopBurnCallerRewardPct(uint _cherryPopBurnCallerRewardPct) external onlyOwner {
        stacy.setCherryPopBurnCallerRewardPct(_cherryPopBurnCallerRewardPct);
    }

    function setSTACYCherryPopBurnPct(uint _cherryPopBurnPct) external onlyOwner {
        stacy.setCherryPopBurnPct(_cherryPopBurnPct);
    }

    function setSTACYFeeDistributor(address _feeDistributor) external onlyOwner {
        stacy.setFeeDistributor(_feeDistributor);
    }
    
    function setSTACYShouldTransferChecker(address _transferCheckerAddress) external onlyOwner {
        stacy.setShouldTransferChecker(_transferCheckerAddress);
    }
}