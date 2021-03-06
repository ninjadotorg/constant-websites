import React from "react";
// import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
// import { Link } from 'react-router-dom';
import { axios, catchError } from "@/services/api";
import { API } from "@/constants";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { isEmpty } from "lodash";
import cn from "@sindresorhus/class-names";
import { Dialog, TextInputField, toaster } from "evergreen-ui";

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

class Voting extends React.Component {
  static propTypes = {
    // abc: PropTypes.object.isRequired,
    // abcd: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      currentType: 1,
      currentApplicant: {},
      applicants: [],
      inited: false,
      amount: ""
    };
  }
  componentDidMount() {
    this.loadCandidatesList(this.state.currentType);
  }

  loadCandidatesList = type => {
    axios
      .get(`${API.VOTING_LIST}?board_type=${type}`)
      .then(res => {
        const { data } = res;
        if (data) {
          const { Result } = data;
          if (Result && Result.length) {
            this.setState({ applicants: Result, inited: true });
          } else {
            this.setState({ applicants: [], inited: true });
          }
        }
      })
      .catch(e => {
        catchError(e);
      });
  };

  changeType = e => {
    this.loadCandidatesList(e.target.value);
  };

  vote = () => {
    const { currentApplicant, amount, currentType } = this.state;
    axios
      .post(API.VOTING_VOTE, {
        BoardType: currentType,
        CandidateID: currentApplicant.ID,
        VoteAmount: Number(amount)
      })
      .then(res => {
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
      })
      .catch(e => {
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
      });
  };

  onlyNumber = (value, cb) => {
    if (!Number.isNaN(Number(value))) {
      cb();
    }
  };

  render() {
    const {
      currentType,
      inited,
      applicants,
      currentApplicant,
      amount,
      isLoading,
      dialogVote
    } = this.state;

    console.log(currentApplicant);

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
                    {!inited && "Loading.."}
                    {inited && applicants.length
                      ? applicants.map(applicant => (
                          <div
                            className={cn("applicant", {
                              active: currentApplicant.ID === applicant.ID
                            })}
                            key={applicant.ID}
                            onClick={() => {
                              this.setState({ currentApplicant: applicant });
                            }}
                          >
                            <div>
                              <div className="email">
                                {applicant.User.Email}
                              </div>
                              <div className="name">{`${
                                applicant.User.FirstName
                              } ${applicant.User.LastName}`}</div>
                              {/* <div className="bio">{applicant.User.Bio}</div> */}
                            </div>
                          </div>
                        ))
                      : ""}
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-6">
                <div className="c-card">
                  {isEmpty(currentApplicant) && (
                    <div className="empty">Please select applicant</div>
                  )}
                  {!isEmpty(currentApplicant) && (
                    <div className="bio">
                      <div className="bio-header">
                        <div className="email">{`${
                          currentApplicant.User.Email
                        }`}</div>
                        <div className="name">{`${
                          currentApplicant.User.FirstName
                        } ${currentApplicant.User.LastName}`}</div>
                      </div>
                      <div className="bio-content">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: `<p>${currentApplicant.User.Bio.replace(
                              /\n{2,}/g,
                              "</p><p>"
                            ).replace(/\n/g, "<br>")}</p>`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-12 col-lg-3">
                <div className="c-card">
                  {isEmpty(currentApplicant) && (
                    <div className="empty">Please select applicant</div>
                  )}
                  {!isEmpty(currentApplicant) && (
                    <div className="right-bar">
                      <div>{`Voted: ${currentApplicant.VoteNum}`}</div>
                      <button
                        className="c-btn c-btn-primary"
                        type="button"
                        style={{ marginTop: 10 }}
                        onClick={() => {
                          this.setState({ dialogVote: true });
                        }}
                      >
                        Vote this applicant
                      </button>
                      <div className="title">Token list</div>
                      <div className="token-list">
                        <table>
                          <tbody>
                            <tr>
                              <td>CMB</td>
                              <td>{currentApplicant.CMB}</td>
                            </tr>
                            <tr>
                              <td>GOV</td>
                              <td>{currentApplicant.GOV}</td>
                            </tr>
                            <tr>
                              <td>DCB</td>
                              <td>{currentApplicant.DCB}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Voting;
