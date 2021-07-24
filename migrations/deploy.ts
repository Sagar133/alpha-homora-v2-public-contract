require('dotenv').config();
import { network } from 'hardhat';

const Bluebird = require("bluebird");
const { ethers } = require("hardhat");

async function main() {
    console.log(`Current network is ${network.name}`);
    
    const [deployer] = await ethers.getSigners();
    console.log('Deployer: ', deployer.address);
    
    const ETH = ethers.utils.parseEther('1');
    
    const ERC20Factory = await ethers.getContractFactory("MockERC20");
    const usdt = await ERC20Factory.deploy('usdt', 'usdt', 18);
    console.log('USDT deployed at addr:', usdt.address);
    const dai = await ERC20Factory.deploy('dai', 'dai', 18);
    console.log('DAI deployed at addr:', dai.address);

    // Mint some tokens for adding liquidity.
    await usdt.mint(deployer.address, ETH.mul(100));
    await dai.mint(deployer.address, ETH.mul(100));

    const WERC20Factory = await ethers.getContractFactory("WERC20");
    const WERC20 = await WERC20Factory.deploy();
    console.log('WERC20 deployed at addr', WERC20.address);

    // Create pairs and add liq. for mock tokens on DFYN.
    const dfynFactory = await ethers.getContractAt(
        'MockUniswapV2Factory', 
        '0xc35dadb65012ec5796536bd9864ed8773abc74c4'
    );
    const dfynRouter = await ethers.getContractAt(
        'MockUniswapV2Router02', 
        '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    );
    await dfynFactory.createPair(usdt.address, dai.address);
    await usdt.approve('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', ETH.mul(50));
    await dai.approve('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', ETH.mul(50));
    console.log('LP token deployed at addr', (await dfynFactory.getPair(usdt.address, dai.address)));

    const coreOracle = await ethers.getContractFactory("CoreOracle");
    const CoreOracle = await coreOracle.deploy();
    console.log('CoreOracle: ', CoreOracle.address);
    
    const ProxyOracle = await ethers.getContractFactory("ProxyOracle");
    const proxyOracle = await ProxyOracle.deploy(CoreOracle.address);
    console.log('ProxyOracle: ', proxyOracle.address);
    
    const bank = await ethers.getContractFactory("HomoraBank");
    const hamoraBank = await bank.deploy();
    console.log('HomoraBank: ', hamoraBank.address);
    
    await hamoraBank.initialize(proxyOracle.address, 2000);
    
    const MockCErc20 = await ethers.getContractFactory("MockCErc20");
    let crDai = await MockCErc20.deploy(dai.address);
    console.log('crDai: ', crDai.address);
    
    let crUSDT = await MockCErc20.deploy(usdt.address);
    console.log('cUSDT: ', crUSDT.address);
    
    await dai.mint(crDai.address, ethers.BigNumber.from(10e6));
    await usdt.mint(crUSDT.address, ETH.mul(10));
    
    await hamoraBank.addBank(dai.address, crDai.address);
    await hamoraBank.addBank(usdt.address, crUSDT.address);

    console.log('Deploying DFYN spell...');
    const spell = await ethers.getContractFactory("UniswapV2SpellV1");
    let dfynSpell = await spell.deploy(
      hamoraBank.address,
      WERC20.address,
      '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    )
    console.log('DFYN spell: ', dfynSpell.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
