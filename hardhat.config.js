const { private_key, etherscan_api, infura_key } = require('./secret.json');

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.6.12",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
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
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: etherscan_api
  }
};
