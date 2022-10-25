// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract NerdFund is Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public iERC20;

    struct ProjectInfo {
        uint256 projectId;
        string name;
        string description;
        string imageLink;
        string dataLink;
        uint256 fund;
        uint256 completeNumber;
    }

    ProjectInfo[] public projects;

    uint256 public completeFund;

    event AddProject(uint256 indexed id, string name);

    event Fund(address indexed funder, uint256 indexed projectId, uint256 amount);

    event Complete(uint256 indexed projectId, uint256 time);

    constructor(address _erc20, uint256 _completeFund) {
        require(_completeFund >= 0, "Nerd fund: invalid argument");

        iERC20 = IERC20(_erc20);

        completeFund = _completeFund;
    }

    function addProject(
        string memory _name,
        string memory _description,
        string memory _imageLink,
        string memory _dataLink
    ) public onlyOwner whenNotPaused {
        ProjectInfo memory newProject = ProjectInfo({
            projectId: projects.length,
            name: _name,
            description: _description,
            imageLink: _imageLink,
            dataLink: _dataLink,
            fund: 0,
            completeNumber: 0
        });

        projects.push(newProject);

        emit AddProject(projects.length - 1, _name);
    }

    function getAllProjects() public view returns (ProjectInfo[] memory projectsInfo) {
        projectsInfo = new ProjectInfo[](projects.length);

        for (uint256 i = 0; i < projects.length; i++) {
            projectsInfo[i] = projects[i];
        }
    }

    function updateCompleteFund(uint256 _completeFund) public onlyOwner whenNotPaused {
        completeFund = _completeFund;
    }

    function fund(uint256 _projectId, uint256 _amount) public whenNotPaused {
        require(_projectId < projects.length, "Nerd fund: invalid projectId");

        iERC20.safeTransferFrom(msg.sender, address(this), _amount);

        projects[_projectId].fund += _amount;

        emit Fund(msg.sender, _projectId, _amount);
    }

    function complete(uint256 _projectId) public onlyOwner {
        require(_projectId < projects.length, "Nerd fund: invalid projectId");

        require(projects[_projectId].fund >= completeFund, "Nerd: Fund is not enough");

        iERC20.safeTransfer(msg.sender, projects[_projectId].fund);

        uint256 time = projects[_projectId].completeNumber;

        projects[_projectId].fund = 0;
        projects[_projectId].completeNumber += 1;

        emit Complete(_projectId, time);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdraw(address _token) public onlyOwner {
        if (_token == address(0)) {
            payable(_msgSender()).transfer(address(this).balance);
        } else {
            IERC20(_token).safeTransfer(_msgSender(), IERC20(_token).balanceOf(address(this)));
        }
    }
}
