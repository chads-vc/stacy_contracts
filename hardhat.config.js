const { private_key, etherscan_api, infura_key, alchemy_key } = require('./secret.json');

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200
      }
    }
  },
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infura_key}`,
      accounts: [private_key]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${infura_key}`,
      accounts: [private_key]
    },
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${alchemy_key}`,
        blockNumber: 11462848
      }
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: etherscan_api
  }
};
