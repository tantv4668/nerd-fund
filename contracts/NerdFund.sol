// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract NerdFund is Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public iERC20;

    struct RoundInfo {
        uint256 project1;
        uint256 project2;
        uint256 project3;
    }

    struct ProjectInfo {
        uint256 projectId;
        string name;
        string description;
        string imageLink;
        string dataLink;
        uint256 fund;
    }

    RoundInfo[] private _rounds;
    mapping(uint256 => ProjectInfo[]) private _projectInRound;
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) private _userInfo; // user address => round => projectId => UserInfo
    mapping(address => uint256) public lastClaim;
    mapping(address => bool) private _blacklist;

    event AddProject(uint256 indexed roundId, uint256 indexed projectId, string name);

    event Complete(uint256 indexed roundId, uint256 project1, uint256 project2, uint256 project3);

    event Fund(
        address indexed user,
        uint256 indexed roundId,
        uint256[] projectIds,
        uint256[] amounts
    );

    constructor(address _erc20) {
        iERC20 = IERC20(_erc20);
    }

    function addProject(
        string[] memory _names,
        string[] memory _descriptions,
        string[] memory _imageLinks,
        string[] memory _dataLinks
    ) public onlyOwner whenNotPaused {
        require(
            _names.length == _descriptions.length &&
                _descriptions.length == _imageLinks.length &&
                _imageLinks.length == _dataLinks.length,
            "Invalid parameters"
        );

        for (uint256 i = 0; i < _names.length; i++) {
            uint256 _round = _rounds.length;
            ProjectInfo memory newProject = ProjectInfo({
                projectId: _projectInRound[_round].length,
                name: _names[i],
                description: _descriptions[i],
                imageLink: _imageLinks[i],
                dataLink: _dataLinks[i],
                fund: 0
            });

            _projectInRound[_round].push(newProject);
            emit AddProject(_round, _projectInRound[_round].length - 1, _names[i]);
        }
    }

    function getAllProjectsInRound(uint256 _round)
        public
        view
        returns (ProjectInfo[] memory projectsInfo)
    {
        require(_round <= _rounds.length, "Invalid round");
        projectsInfo = new ProjectInfo[](_projectInRound[_round].length);

        for (uint256 i = 0; i < _projectInRound[_round].length; i++) {
            projectsInfo[i] = _projectInRound[_round][i];
        }
    }

    function getProject(uint256 _round, uint256 _projectId)
        public
        view
        returns (ProjectInfo memory)
    {
        require(_round <= _rounds.length, "Invalid round");
        require(_projectId < _projectInRound[_round].length, "Invalid projectId");
        return _projectInRound[_round][_projectId];
    }

    function fund(uint256[] memory _projectIds, uint256[] memory _amounts) public whenNotPaused {
        require(_blacklist[msg.sender] == false, "You are blocked");
        require(_projectIds.length == _amounts.length, "Invalid parameters");

        uint256 total = 0;
        uint256 _round = _rounds.length;
        for (uint256 i = 0; i < _projectIds.length; i++) {
            require(_projectIds[i] < _projectInRound[_round].length, "Invalid projectId");
            require(_amounts[i] > 0, "Invalid amount");

            total = total + _amounts[i];

            _userInfo[msg.sender][_round][_projectIds[i]] += _amounts[i];

            _projectInRound[_round][_projectIds[i]].fund += _amounts[i];
        }

        iERC20.safeTransferFrom(msg.sender, address(this), total);

        emit Fund(msg.sender, _round, _projectIds, _amounts);
    }

    function getUserInfo(address _user, uint256 _round) public view returns (uint256[] memory) {
        require(_round <= _rounds.length, "Invalid round");

        uint256[] memory info = new uint256[](_projectInRound[_round].length);

        for (uint256 i = 0; i < _projectInRound[_round].length; i++) {
            info[i] = _userInfo[_user][_round][i];
        }

        return info;
    }

    function complete(
        uint256 _project1,
        uint256 _project2,
        uint256 _project3
    ) public whenNotPaused onlyOwner {
        uint256 _round = _rounds.length;

        uint256 totalAmount = _projectInRound[_round][_project1].fund +
            _projectInRound[_round][_project2].fund +
            _projectInRound[_round][_project3].fund;

        iERC20.safeTransfer(msg.sender, totalAmount);

        _rounds.push(RoundInfo({project1: _project1, project2: _project2, project3: _project3}));

        emit Complete(_round, _project1, _project2, _project3);
    }

    function claim() public whenNotPaused {
        require(_blacklist[msg.sender] == false, "You are blocked");
        require(lastClaim[msg.sender] < _rounds.length, "Already claimed");

        uint256 total;

        for (uint256 i = lastClaim[msg.sender]; i < _rounds.length; i++) {
            for (uint256 j = 0; j < _projectInRound[i].length; j++)
                if (
                    j != _rounds[i].project1 &&
                    j != _rounds[i].project2 &&
                    j != _rounds[i].project3 &&
                    _userInfo[msg.sender][i][j] > 0
                ) {
                    total = total + _userInfo[msg.sender][i][j];
                }
        }

        lastClaim[msg.sender] = _rounds.length;

        if (total > 0) {
            iERC20.safeTransfer(msg.sender, total);
        }
    }

    function claimTo(uint256 _to) public whenNotPaused {
        require(_blacklist[msg.sender] == false, "You are blocked");
        require(_to < _rounds.length, "Invalid to parameter");
        require(lastClaim[msg.sender] <= _to, "Already claimed");

        uint256 total;

        for (uint256 i = lastClaim[msg.sender]; i <= _to; i++) {
            for (uint256 j = 0; j < _projectInRound[i].length; j++)
                if (
                    j != _rounds[i].project1 &&
                    j != _rounds[i].project2 &&
                    j != _rounds[i].project3 &&
                    _userInfo[msg.sender][i][j] > 0
                ) {
                    total = total + _userInfo[msg.sender][i][j];
                }
        }

        lastClaim[msg.sender] = _to + 1;

        if (total > 0) {
            iERC20.safeTransfer(msg.sender, total);
        }
    }

    function getClaimableAmount(address _user) public view returns (uint256) {
        uint256 total;

        for (uint256 i = lastClaim[_user]; i < _rounds.length; i++) {
            for (uint256 j = 0; j < _projectInRound[i].length; j++)
                if (
                    j != _rounds[i].project1 &&
                    j != _rounds[i].project2 &&
                    j != _rounds[i].project3 &&
                    _userInfo[_user][i][j] > 0
                ) {
                    total = total + _userInfo[_user][i][j];
                }
        }

        return total;
    }

    function switchFund(uint256[] memory _projectIds, uint256[] memory _amounts)
        public
        whenNotPaused
    {
        require(_blacklist[msg.sender] == false, "You are blocked");
        require(_projectIds.length == _amounts.length, "Invalid Parameters");
        require(lastClaim[msg.sender] < _rounds.length, "Already claimed");

        uint256 total;
        for (uint256 i = lastClaim[msg.sender]; i < _rounds.length; i++) {
            for (uint256 j = 0; j < _projectInRound[i].length; j++)
                if (
                    j != _rounds[i].project1 &&
                    j != _rounds[i].project2 &&
                    j != _rounds[i].project3 &&
                    _userInfo[msg.sender][i][j] > 0
                ) {
                    total = total + _userInfo[msg.sender][i][j];
                }
        }

        require(total > 0, "Invalid switchFund");

        lastClaim[msg.sender] = _rounds.length;

        uint256 _round = _rounds.length;

        for (uint256 i = 0; i < _projectIds.length; i++) {
            require(_projectIds[i] < _projectInRound[_round].length, "Invalid projectId");
            require(_amounts[i] > 0, "Invalid amount");
            require(total >= _amounts[i], "Not enough token");

            total = total - _amounts[i];

            _userInfo[msg.sender][_round][_projectIds[i]] += _amounts[i];

            _projectInRound[_round][_projectIds[i]].fund += _amounts[i];
        }

        if (total > 0) {
            iERC20.safeTransfer(msg.sender, total);
        }

        emit Fund(msg.sender, _round, _projectIds, _amounts);
    }

    function round() public view returns (uint256) {
        return _rounds.length;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function blockUser(address _user) public onlyOwner {
        _blacklist[_user] = true;
    }

    function withdraw(address _token) public onlyOwner {
        if (_token == address(0)) {
            payable(_msgSender()).transfer(address(this).balance);
        } else {
            IERC20(_token).safeTransfer(_msgSender(), IERC20(_token).balanceOf(address(this)));
        }
    }
}
