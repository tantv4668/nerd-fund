/** @format */

const { ethers } = require('hardhat');
const { expect, use } = require('chai');

describe('WcNFT', async () => {
  let busd, nerd;
  let admin, user1, user2, user3, user4, user5;

  let name = [
    'name1',
    'name2',
    'name3',
    'name4',
    'name5',
    'name6',
    'name7',
    'name8',
    'name9',
    'name10',
  ];

  let desc = [
    'desc1',
    'desc2',
    'desc3',
    'desc4',
    'desc5',
    'desc6',
    'desc7',
    'desc8',
    'desc9',
    'desc10',
  ];

  let image = [
    'image1',
    'image2',
    'image3',
    'image4',
    'image5',
    'image6',
    'image7',
    'image8',
    'image9',
    'image10',
  ];

  let data = [
    'data1',
    'data2',
    'data3',
    'data4',
    'data5',
    'data6',
    'data7',
    'data8',
    'data9',
    'data10',
  ];

  let wei = '000000000000000000';

  let mintAmount = '10000' + wei;

  beforeEach(async () => {
    [admin, user1, user2, user3, user4, user5] = await ethers.getSigners();

    let MockBusd = await ethers.getContractFactory('MockBUSD');

    busd = await MockBusd.connect(admin).deploy('BUSD', 'BUSD');

    let NerdFund = await ethers.getContractFactory('NerdFund');

    nerd = await NerdFund.connect(admin).deploy(busd.address);

    await busd.connect(admin).mint(user1.address, mintAmount);
    await busd.connect(admin).mint(user2.address, mintAmount);
    await busd.connect(admin).mint(user3.address, mintAmount);
    await busd.connect(admin).mint(user4.address, mintAmount);
    await busd.connect(admin).mint(user5.address, mintAmount);
  });

  it('Deploy successfully', async () => {
    expect(await nerd.iERC20()).to.equal(busd.address);
  });

  it('Add project successfully', async () => {
    await nerd.connect(admin).addProject(name, desc, image, data);

    expect(await nerd.round()).to.be.equal(0);
    expect((await nerd.getAllProjectsInRound(0)).length).to.be.equal(10);
    await expect(nerd.getAllProjectsInRound(1)).to.be.revertedWith('Invalid round');

    let project = await nerd.getProject(0, 0);
    expect(project.name).to.be.equal(name[0]);
    expect(project.description).to.be.equal(desc[0]);
    expect(project.imageLink).to.be.equal(image[0]);
    expect(project.dataLink).to.be.equal(data[0]);

    await expect(nerd.getProject(1, 0)).to.be.revertedWith('Invalid round');
    await expect(nerd.getProject(0, 100)).to.be.revertedWith('Invalid projectId');
  });

  it('Fund', async () => {
    await nerd.connect(admin).addProject(name, desc, image, data);

    await busd.connect(user1).approve(nerd.address, mintAmount);
    await busd.connect(user2).approve(nerd.address, mintAmount);
    await busd.connect(user3).approve(nerd.address, mintAmount);
    await busd.connect(user4).approve(nerd.address, mintAmount);
    await busd.connect(user5).approve(nerd.address, mintAmount);

    await nerd.connect(user1).fund([0, 1, 2], ['10' + wei, '20' + wei, '30' + wei]);
    await nerd.connect(user2).fund([2, 3, 4], ['20' + wei, '30' + wei, '40' + wei]);
    await nerd.connect(user3).fund([4, 5, 6], ['30' + wei, '40' + wei, '50' + wei]);
    await nerd.connect(user4).fund([6, 7, 8], ['40' + wei, '50' + wei, '60' + wei]);
    await nerd.connect(user5).fund([8, 9, 0], ['50' + wei, '60' + wei, '70' + wei]);

    expect((await nerd.getProject(0, 0)).fund).to.be.equal('80' + wei);
    expect((await nerd.getProject(0, 1)).fund).to.be.equal('20' + wei);
    expect((await nerd.getProject(0, 2)).fund).to.be.equal('50' + wei);
    expect((await nerd.getProject(0, 3)).fund).to.be.equal('30' + wei);
    expect((await nerd.getProject(0, 4)).fund).to.be.equal('70' + wei);
    expect((await nerd.getProject(0, 5)).fund).to.be.equal('40' + wei);
    expect((await nerd.getProject(0, 6)).fund).to.be.equal('90' + wei);
    expect((await nerd.getProject(0, 7)).fund).to.be.equal('50' + wei);
    expect((await nerd.getProject(0, 8)).fund).to.be.equal('110' + wei);
    expect((await nerd.getProject(0, 9)).fund).to.be.equal('60' + wei);

    await expect(nerd.getUserInfo(user1.address, 1)).to.be.revertedWith('Invalid round');
    await expect(nerd.getUserInfo(user2.address, 1)).to.be.revertedWith('Invalid round');
    await expect(nerd.getUserInfo(user3.address, 1)).to.be.revertedWith('Invalid round');
    await expect(nerd.getUserInfo(user4.address, 1)).to.be.revertedWith('Invalid round');
    await expect(nerd.getUserInfo(user5.address, 1)).to.be.revertedWith('Invalid round');

    let user1Info = await nerd.getUserInfo(user1.address, 0);
    expect(user1Info.length).to.be.equal(10);
    expect(user1Info[0]).to.be.equal('10' + wei);
    expect(user1Info[1]).to.be.equal('20' + wei);
    expect(user1Info[2]).to.be.equal('30' + wei);

    let user2Info = await nerd.getUserInfo(user2.address, 0);
    expect(user2Info.length).to.be.equal(10);
    expect(user2Info[2]).to.be.equal('20' + wei);
    expect(user2Info[3]).to.be.equal('30' + wei);
    expect(user2Info[4]).to.be.equal('40' + wei);

    let user3Info = await nerd.getUserInfo(user3.address, 0);
    expect(user3Info.length).to.be.equal(10);
    expect(user3Info[4]).to.be.equal('30' + wei);
    expect(user3Info[5]).to.be.equal('40' + wei);
    expect(user3Info[6]).to.be.equal('50' + wei);

    let user4Info = await nerd.getUserInfo(user4.address, 0);
    expect(user4Info.length).to.be.equal(10);
    expect(user4Info[6]).to.be.equal('40' + wei);
    expect(user4Info[7]).to.be.equal('50' + wei);
    expect(user4Info[8]).to.be.equal('60' + wei);

    let user5Info = await nerd.getUserInfo(user5.address, 0);
    expect(user5Info.length).to.be.equal(10);
    expect(user5Info[8]).to.be.equal('50' + wei);
    expect(user5Info[9]).to.be.equal('60' + wei);
    expect(user5Info[0]).to.be.equal('70' + wei);

    await nerd.connect(admin).addProject(name, desc, image, data);
    expect(await nerd.round()).to.be.equal(0);
    expect((await nerd.getAllProjectsInRound(0)).length).to.be.equal(20);
    await expect(nerd.getAllProjectsInRound(1)).to.be.revertedWith('Invalid round');

    await nerd.connect(user1).fund([0, 1, 2], ['10' + wei, '20' + wei, '30' + wei]);
    await nerd.connect(user2).fund([3, 4, 5], ['20' + wei, '30' + wei, '40' + wei]);
    await nerd.connect(user3).fund([6, 7, 8], ['30' + wei, '40' + wei, '50' + wei]);
    await nerd
      .connect(user4)
      .fund([10, 11, 12, 13, 14], ['40' + wei, '50' + wei, '60' + wei, '70' + wei, '80' + wei]);
    await nerd
      .connect(user5)
      .fund([15, 16, 17, 18, 19], ['50' + wei, '60' + wei, '70' + wei, '80' + wei, '90' + wei]);

    expect((await nerd.getProject(0, 0)).fund).to.be.equal('90' + wei);
    expect((await nerd.getProject(0, 1)).fund).to.be.equal('40' + wei);
    expect((await nerd.getProject(0, 2)).fund).to.be.equal('80' + wei);
    expect((await nerd.getProject(0, 3)).fund).to.be.equal('50' + wei);
    expect((await nerd.getProject(0, 4)).fund).to.be.equal('100' + wei);
    expect((await nerd.getProject(0, 5)).fund).to.be.equal('80' + wei);
    expect((await nerd.getProject(0, 6)).fund).to.be.equal('120' + wei);
    expect((await nerd.getProject(0, 7)).fund).to.be.equal('90' + wei);
    expect((await nerd.getProject(0, 8)).fund).to.be.equal('160' + wei);
    expect((await nerd.getProject(0, 9)).fund).to.be.equal('60' + wei);
    expect((await nerd.getProject(0, 10)).fund).to.be.equal('40' + wei);
    expect((await nerd.getProject(0, 11)).fund).to.be.equal('50' + wei);
    expect((await nerd.getProject(0, 12)).fund).to.be.equal('60' + wei);
    expect((await nerd.getProject(0, 13)).fund).to.be.equal('70' + wei);
    expect((await nerd.getProject(0, 14)).fund).to.be.equal('80' + wei);
    expect((await nerd.getProject(0, 15)).fund).to.be.equal('50' + wei);
    expect((await nerd.getProject(0, 16)).fund).to.be.equal('60' + wei);
    expect((await nerd.getProject(0, 17)).fund).to.be.equal('70' + wei);
    expect((await nerd.getProject(0, 18)).fund).to.be.equal('80' + wei);
    expect((await nerd.getProject(0, 19)).fund).to.be.equal('90' + wei);

    user1Info = await nerd.getUserInfo(user1.address, 0);
    expect(user1Info.length).to.be.equal(20);
    expect(user1Info[0]).to.be.equal('20' + wei);
    expect(user1Info[1]).to.be.equal('40' + wei);
    expect(user1Info[2]).to.be.equal('60' + wei);

    user2Info = await nerd.getUserInfo(user2.address, 0);
    expect(user2Info.length).to.be.equal(20);
    expect(user2Info[2]).to.be.equal('20' + wei);
    expect(user2Info[3]).to.be.equal('50' + wei);
    expect(user2Info[4]).to.be.equal('70' + wei);
    expect(user2Info[5]).to.be.equal('40' + wei);

    user3Info = await nerd.getUserInfo(user3.address, 0);
    expect(user3Info.length).to.be.equal(20);
    expect(user3Info[4]).to.be.equal('30' + wei);
    expect(user3Info[5]).to.be.equal('40' + wei);
    expect(user3Info[6]).to.be.equal('80' + wei);
    expect(user3Info[7]).to.be.equal('40' + wei);
    expect(user3Info[8]).to.be.equal('50' + wei);

    user4Info = await nerd.getUserInfo(user4.address, 0);
    expect(user4Info.length).to.be.equal(20);
    expect(user4Info[6]).to.be.equal('40' + wei);
    expect(user4Info[7]).to.be.equal('50' + wei);
    expect(user4Info[8]).to.be.equal('60' + wei);
    expect(user4Info[10]).to.be.equal('40' + wei);
    expect(user4Info[11]).to.be.equal('50' + wei);
    expect(user4Info[12]).to.be.equal('60' + wei);
    expect(user4Info[13]).to.be.equal('70' + wei);
    expect(user4Info[14]).to.be.equal('80' + wei);

    user5Info = await nerd.getUserInfo(user5.address, 0);
    expect(user5Info.length).to.be.equal(20);
    expect(user5Info[8]).to.be.equal('50' + wei);
    expect(user5Info[9]).to.be.equal('60' + wei);
    expect(user5Info[0]).to.be.equal('70' + wei);
    expect(user5Info[15]).to.be.equal('50' + wei);
    expect(user5Info[16]).to.be.equal('60' + wei);
    expect(user5Info[17]).to.be.equal('70' + wei);
    expect(user5Info[18]).to.be.equal('80' + wei);
    expect(user5Info[19]).to.be.equal('90' + wei);

    expect(await busd.balanceOf(nerd.address)).to.be.equal('1520' + wei);
    await nerd.connect(admin).complete(4, 6, 8);

    expect(await busd.balanceOf(nerd.address)).to.be.equal('1140' + wei);
    expect(await busd.balanceOf(admin.address)).to.be.equal('380' + wei);

    expect(await nerd.getClaimableAmount(user1.address)).to.be.equal('120' + wei);
    expect(await nerd.getClaimableAmount(user2.address)).to.be.equal('110' + wei);
    expect(await nerd.getClaimableAmount(user3.address)).to.be.equal('80' + wei);
    expect(await nerd.getClaimableAmount(user4.address)).to.be.equal('350' + wei);
    expect(await nerd.getClaimableAmount(user5.address)).to.be.equal('480' + wei);

    await nerd.connect(user1).claim();
    expect(await busd.balanceOf(user1.address)).to.be.equal('10000' + wei);
    await expect(nerd.connect(user1).claim()).to.be.revertedWith('Already claimed');
    await expect(nerd.connect(user1).claimTo(0)).to.be.revertedWith('Already claimed');
    await expect(nerd.connect(user1).claimTo(1)).to.be.revertedWith('Invalid to parameter');

    await expect(nerd.connect(user2).claimTo(1)).to.be.revertedWith('Invalid to parameter');
    await nerd.connect(user2).claimTo(0);
    expect(await busd.balanceOf(user2.address)).to.be.equal('9930' + wei);
    await expect(nerd.connect(user1).claim()).to.be.revertedWith('Already claimed');
    await expect(nerd.connect(user1).claimTo(0)).to.be.revertedWith('Already claimed');

    await nerd.connect(admin).addProject(name, desc, image, data);
    await nerd.connect(user1).fund([0, 1, 2], ['10' + wei, '20' + wei, '30' + wei]);
    await nerd.connect(user2).fund([2, 3, 4], ['20' + wei, '30' + wei, '40' + wei]);
    await nerd.connect(user3).switchFund([4, 5, 6], ['10' + wei, '20' + wei, '30' + wei]);
    await nerd.connect(user4).fund([6, 7, 8], ['40' + wei, '50' + wei, '60' + wei]);
    await nerd.connect(user5).fund([8, 9, 0], ['50' + wei, '60' + wei, '70' + wei]);

    await expect(nerd.connect(user3).claim()).to.be.revertedWith('Already claimed');
    await expect(nerd.connect(user3).claimTo(0)).to.be.revertedWith('Already claimed');
    await expect(nerd.connect(user3).claimTo(1)).to.be.revertedWith('Invalid to parameter');

    expect(await busd.balanceOf(user1.address)).to.be.equal('9940' + wei);
    expect(await busd.balanceOf(user3.address)).to.be.equal('9780' + wei);

    await nerd.connect(admin).complete(2, 5, 6);

    expect(await busd.balanceOf(admin.address)).to.be.equal('520' + wei);

    expect(await nerd.getClaimableAmount(user1.address)).to.be.equal('30' + wei);
    expect(await nerd.getClaimableAmount(user2.address)).to.be.equal('70' + wei);
    expect(await nerd.getClaimableAmount(user3.address)).to.be.equal('10' + wei);
    expect(await nerd.getClaimableAmount(user4.address)).to.be.equal('460' + wei);
    expect(await nerd.getClaimableAmount(user5.address)).to.be.equal('660' + wei);

    await nerd.connect(user4).claimTo(0);
    await nerd.connect(user4).claim();
    await expect(nerd.connect(user4).claim()).to.be.revertedWith('Already claimed');
    await expect(nerd.connect(user4).claimTo(1)).to.be.revertedWith('Already claimed');
    await expect(nerd.connect(user4).claimTo(2)).to.be.revertedWith('Invalid to parameter');
    expect(await busd.balanceOf(user4.address)).to.be.equal('9860' + wei);

    await nerd.connect(admin).addProject(name, desc, image, data);

    await nerd.connect(user1).fund([0, 1, 2], ['10' + wei, '20' + wei, '30' + wei]);
    await nerd.connect(user2).fund([2, 3, 4], ['20' + wei, '30' + wei, '40' + wei]);
    await nerd.connect(user3).fund([4, 5, 6], ['10' + wei, '20' + wei, '30' + wei]);
    await nerd.connect(user4).fund([6, 7, 8], ['40' + wei, '50' + wei, '60' + wei]);

    await nerd.connect(user5).claimTo(0);
    expect(await nerd.getClaimableAmount(user5.address)).to.be.equal('180' + wei);
    await nerd.connect(user5).switchFund([8, 9, 0], ['50' + wei, '60' + wei, '70' + wei]);

    await nerd.connect(admin).complete(7, 8, 9);
    expect(await busd.balanceOf(admin.address)).to.be.equal('740' + wei);
    expect(await nerd.getClaimableAmount(user1.address)).to.be.equal('90' + wei);
    expect(await nerd.getClaimableAmount(user2.address)).to.be.equal('160' + wei);
    expect(await nerd.getClaimableAmount(user3.address)).to.be.equal('70' + wei);
    expect(await nerd.getClaimableAmount(user4.address)).to.be.equal('40' + wei);
    expect(await nerd.getClaimableAmount(user5.address)).to.be.equal('70' + wei);
  });
});
