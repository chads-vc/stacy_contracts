async function main() {

    const [deployer] = await ethers.getSigners();
  
    console.log(
      "Deploying contracts with the account:",
      deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const StacyWrapper = await ethers.getContractFactory("StacyCherryPopWrapper");
    const stacyWrapper = await StacyWrapper.deploy("0xf12EC0D3Dab64DdEfBdC96474bDe25af3FE1B327", "0xdfcc12a0aad50d84639d558551edd7a523b69ac5");

    console.log("Address:", stacyWrapper.address);
}
  
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});