require('dotenv').config();
import { network } from 'hardhat';

const Bluebird = require("bluebird") 
const { ethers } = require("hardhat")

async function main() {
    console.log(network.name);

    const [deployer] = await ethers.getSigners();
    console.log('deployer', deployer.address);
    
    // Deploying the mock token
    const mockUsdt = await ethers.getContractFactory("MockERC20");
    const usdt = await mockUsdt.deploy('usdt', 'usdt', 6);
    console.log('USDT', usdt.address);
    
    const mockDai = await ethers.getContractFactory("MockERC20");
    const dai = await mockUsdt.deploy('dai', 'dai', 6);
    console.log('DAI', dai.address);

    const werc20 = await ethers.getContractFactory("WERC20");
    const WERC20 = await werc20.deploy();
    console.log('WERC20', WERC20.address);

    const SimpleOracle = await ethers.getContractFactory("SimpleOracle");
    const simpleOracle = await SimpleOracle.deploy();
    console.log('simpleOracle', simpleOracle.address);

    // await simpleOracle.setETHPx(
    //   [usdt.address, dai.address],
    //   [
    //     8887571220661441971398610676149,
    //     8887571220661441971398610676149
    //   ]
    // );

    const coreOracle = await ethers.getContractFactory("CoreOracle");
    const CoreOracle = await coreOracle.deploy();
    console.log('CoreOracle', CoreOracle.address);
    
    const ProxyOracle = await ethers.getContractFactory("ProxyOracle");
    const proxyOracle = await ProxyOracle.deploy(CoreOracle.address);
    console.log('proxyOracle', proxyOracle.address);
    
    const bank = await ethers.getContractFactory("HomoraBank");
    const hamoraBank = await bank.deploy();
    console.log('hamoraBank', hamoraBank.address);
    
    await hamoraBank.initialize(proxyOracle.address, 2000);
    
    const MockCErc20 = await ethers.getContractFactory("MockCErc20");
    let crDai = await MockCErc20.deploy(dai.address);
    console.log('crDai', crDai.address);
    
    let crUSDT = await MockCErc20.deploy(usdt.address);
    console.log('cUSDT', crUSDT.address);
    
    await dai.mint(crDai.address, 10e6);
    await usdt.mint(crUSDT.address, 10e6);
    
    await hamoraBank.addBank(dai.address, crDai.address);
    await hamoraBank.addBank(usdt.address, crUSDT.address);

    console.log('deploying dfyn spell');
    const spell = await ethers.getContractFactory("UniswapV2SpellV1");
    let dfynSpell = await spell.deploy(
      hamoraBank.address,
      WERC20.address,
      '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    )
    console.log('dfynSpell', dfynSpell.address);
    
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
