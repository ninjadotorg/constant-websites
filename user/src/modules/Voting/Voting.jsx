import React from "react";
import { axios, catchError } from "services/api";
import { API } from "constants/index";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { Dialog, TextInputField, toaster } from "evergreen-ui";
import _ from "lodash";
import { RightContent } from "./RightContent";
import { CenterContent } from "./CenterContent";
import { ApplicantListItem } from "./ApplicantListItem";

const list = [
  {
    value: 1,
    name: "DCB"
  },
  {
    value: 2,
    name: "GOV"
  },
  {
    value: 3,
    name: "CMB"
  }
];

const renderIf = condition => component => (condition ? component : null);

class Voting extends React.Component {
  state = {
    currentType: 1,
    applicants: [],
    amount: "",
    isLoadingApplicants: false
  };

  componentDidMount() {
    this.loadCandidatesList(this.state.currentType);
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.currentType !== prevState.currentType) {
      this.loadCandidatesList(this.state.currentType);
    }
  }

  loadCandidatesList = async (type, selectedApplicantIndex = -1) => {
    try {
      this.setState({
        isLoadingApplicants: true,
        selectedApplicantIndex: selectedApplicantIndex
      });
      const res = await axios.get(`${API.VOTING_LIST}?board_type=${type}`);
      this.setState({
        applicants: _.get(res, "data.Result", [])
      });
    } catch (e) {
      catchError(e);
    }
    this.setState({ isLoadingApplicants: false });
  };

  changeType = e => {
    this.setState({ currentType: e.target.value });
  };

  vote = async () => {
    const {
      selectedApplicantIndex,
      applicants,
      amount,
      currentType
    } = this.state;
    const currentApplicant = applicants[selectedApplicantIndex];
    try {
      const res = await axios.post(API.VOTING_VOTE, {
        BoardType: currentType,
        CandidateID: currentApplicant.ID,
        VoteAmount: Number(amount)
      });

      const { data } = res;
      if (data) {
        const { Error: resError } = data;
        if (resError) {
          toaster.warning(resError.Message);
        } else {
          toaster.success("Vote success!");
        }
      }

      this.setState({ isLoading: false, dialogVote: false });
      this.loadCandidatesList(
        this.state.currentType,
        this.state.selectedApplicantIndex
      );
    } catch (e) {
      const { response } = e;
      const { data } = response;
      if (data) {
        const { Error: resError } = data;
        if (resError) {
          toaster.warning(resError.Message);
        }
      }
      this.setState({ isLoading: false, dialogVote: false });
      catchError(e);
    }
  };

  onlyNumber = (value, cb) => {
    if (!Number.isNaN(Number(value))) {
      cb();
    }
  };
  onSelectApplicant = index => this.setState({ selectedApplicantIndex: index });

  render() {
    const {
      currentType,
      isLoadingApplicants,
      applicants,
      selectedApplicantIndex,
      amount,
      isLoading,
      dialogVote
    } = this.state;

    return (
      <div className="page user-page proposals-page">
        <Dialog
          isShown={dialogVote}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEscapePress={false}
          title="Vote"
          confirmLabel="Vote"
          isConfirmLoading={isLoading}
          onCloseComplete={() =>
            this.setState({
              dialogVote: false,
              isLoading: false,
              amount: ""
            })
          }
          onConfirm={() => {
            this.setState({ isLoading: true });
            this.vote();
          }}
        >
          <div className="withdraw-dialog">
            <div style={{ margin: "0" }}>
              <TextInputField
                label="Amount"
                placeholder="0.00"
                autoComplete="off"
                width="100%"
                type="text"
                value={amount}
                onChange={e => {
                  this.onlyNumber(e.target.value, () => {
                    this.setState({ amount: e.target.value });
                  });
                }}
              />
            </div>
          </div>
        </Dialog>
        <div className="proposal-list">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 col-lg-3 left-side">
                <div className="c-card">
                  <div className="title">
                    <span>Applicants</span>
                    <div className="select" style={{ float: "right" }}>
                      <Select
                        disabled={isLoadingApplicants}
                        value={currentType}
                        onChange={this.changeType}
                        inputProps={{
                          name: "proposalsType",
                          id: "proposals-type"
                        }}
                      >
                        {list.map(item => (
                          <MenuItem key={item.value} value={item.value}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                    <div className="clearfix" />
                  </div>
                  <div className="content">
                    {renderIf(isLoadingApplicants)("Loading..")}
                    {renderIf(!isLoadingApplicants && applicants.length)(
                      applicants.map((applicant, index) => (
                        <ApplicantListItem
                          key={applicant.ID}
                          active={index === this.state.selectedApplicantIndex}
                          applicant={applicant}
                          onClick={this.onSelectApplicant.bind(this, index)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              <CenterContent applicant={applicants[selectedApplicantIndex]} />
              <RightContent
                placeholder="Please select applicant"
                user={_.get(applicants, `${selectedApplicantIndex}.User`)}
                balances={_.get(
                  applicants,
                  `${selectedApplicantIndex}.Balances.ListBalances`
                )}
                vote={_.get(applicants, `${selectedApplicantIndex}.VoteNum`)}
                onClickVote={() => {
                  this.setState({ dialogVote: true });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Voting;
