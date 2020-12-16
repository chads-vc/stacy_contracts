async function main() {

    const [deployer] = await ethers.getSigners();
  
    console.log(
      "Deploying contracts with the account:",
      deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const FeeApprover = await ethers.getContractFactory("FeeApprover");
    // constructor args STACY address, WETH address, uniswap factory address
    // rinkeby deploy args
    //const contract_obj = await FeeApprover.deploy("0xe86C3279e6732c4BE79Cb48C3E5b79A81492a8a5", "0xc778417e063141139fce010982780140aa0cd5ab", "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
    // mainnet config
    const contract_obj = await FeeApprover.deploy("0xf12EC0D3Dab64DdEfBdC96474bDe25af3FE1B327", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");

    console.log("Address:", contract_obj.address);
}
  
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});