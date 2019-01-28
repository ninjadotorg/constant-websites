import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Link from '@/components/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import {
  faArrowRight, faEdit, faPlus, faMinus,
} from '@fortawesome/pro-regular-svg-icons';
import bgApplyGOV from '@/assets/apply-gov.svg';
import bgApplyDCB from '@/assets/apply-dcb.svg';
import bgApplyMCB from '@/assets/apply-mcb.svg';
import { axios, catchError } from '@/services/api';
import { API } from '@/constants';
import cn from '@sindresorhus/class-names';
import bgImage from '@/assets/create-a-proposal.svg';
import {
  Dialog, Textarea, toaster, TextInputField,
} from 'evergreen-ui';
import { checkAuth } from '@/reducers/auth/action';
import { Formik, FieldArray } from 'formik';
import { jsonToKeyValue, jsonToFormat } from '@/services/data';
import { isEmpty } from 'lodash';
import toSpace from 'to-space-case';

const CheckInit = ({ children, inited }) => {
  if (!inited) {
    return <div />;
  }
  return children;
};

const Applied = ({ applied, children }) => {
  if (applied) return 'Applied';
  return children;
};

class Home extends React.Component {
  static propTypes = {
    auth: PropTypes.object.isRequired,
    authCheckAuth: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    const { auth } = props;

    this.state = {
      candidate: {},
      inited: false,
      address: '',
      dialogBio: false,
      dialogDCBProposal: false,
      dialogGOVProposal: false,
      isLoading: false,
      bio: auth.data.Bio,
      oldBio: auth.data.Bio,
      dcbParams: {},
      dcbFormat: {},
      dcbFields: {},
      govParams: {},
      govFormat: {},
      govFields: {},
    };

    this.loadUserCandidate();
    this.loadGovParams();
    this.loadDcbParams();
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.auth.data.Bio !== prevState.oldBio) {
      return { bio: nextProps.auth.data.Bio, oldBio: nextProps.auth.data.Bio };
    }
    return null;
  }

  loadUserCandidate = () => {
    axios.get(API.VOTING_DATA).then((res) => {
      const { data } = res;
      if (data) {
        const { Result, Error: resError } = data;
        if (!resError) {
          this.setState({
            candidate: Result || {},
            inited: true,
          });
        }
      }
    }).catch((e) => {
      catchError(e);
    });
  }

  loadGovParams = () => {
    axios.get(API.VOTING_GOV_PARAMS).then((res) => {
      const { data } = res;
      if (data) {
        const { Result } = data;
        if (Result) {
          const { GOVParams } = Result;
          if (GOVParams) {
            console.log('GOVParams', GOVParams);
            const govFields = jsonToKeyValue(GOVParams);
            const govFormat = jsonToFormat(GOVParams);
            this.setState({ govParams: GOVParams, govFields, govFormat });
          }
        }
      }
    }).catch((e) => {
      catchError(e);
    });
  }

  loadDcbParams = () => {
    axios.get(API.VOTING_DCB_PARAMS).then((res) => {
      const { data } = res;
      if (data) {
        const { Result } = data;
        if (Result) {
          const { DCBParams } = Result;
          if (DCBParams) {
            console.log('DCBParams', DCBParams);
            const dcbFields = jsonToKeyValue(DCBParams);
            const dcbFormat = jsonToFormat(DCBParams);
            this.setState({ dcbParams: DCBParams, dcbFields, dcbFormat });
          }
        }
      }
    }).catch((e) => {
      catchError(e);
    });
  }

  submitBio = () => {
    const { bio } = this.state;
    const { authCheckAuth } = this.props;

    if (!bio) {
      toaster.warning('Bio is required');
      this.setState({ isLoading: false });
      return;
    }

    axios.put(API.USER_UPDATE, {
      Bio: bio,
    }).then((res) => {
      const { data } = res;
      const { Result } = data;
      if (Result) {
        this.setState({ isLoading: false, dialogBio: false });
        toaster.success('Updated your bio');
        authCheckAuth();
      } else {
        toaster.warning('Error update profile');
      }
    }).catch((e) => {
      this.setState({ isLoading: false, dialogBio: false });
      toaster.warning('Error update profile');
      catchError(e);
    });
  }

  submitCreateDCB = (values, setSubmitting) => {
    console.log('values, setSubmitting', values, setSubmitting);
    const { dcbParams, dcbFields, dcbFormat } = this.state;
    console.log(dcbParams, dcbFields, dcbFormat);
  }

  submitCreateGOV = (values, setSubmitting) => {
    console.log('values, setSubmitting', values, setSubmitting);
    const { govParams, govFields, govFormat } = this.state;
    console.log(govParams, govFields, govFormat);
  }

  apply = (type, ev, denyCall) => {
    ev.preventDefault();
    const { address } = this.state;

    if (!denyCall) {
      axios.post(API.VOTING_APPLY, {
        PaymentAddress: address,
        BoardType: type,
      }).then((res) => {
        const { data } = res;
        if (data) {
          const { Result } = data;
          if (Result) {
            this.loadUserCandidate();
            toaster.success('Apply success!');
          }
        }
      }).catch((e) => {
        catchError(e);
      });
    }
  }

  render() {
    const {
      inited,
      isLoading,
      dialogBio,
      dialogDCBProposal,
      // dialogGOVProposal,
      bio,
      candidate,
      dcbParams,
      // govParams,
    } = this.state;
    const { auth } = this.props;
    return (
      <div className="page user-page home-page">
        <Dialog
          isShown={dialogBio}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEscapePress={false}
          title="Edit your bio"
          confirmLabel="Submit"
          isConfirmLoading={isLoading}
          onCloseComplete={() => this.setState({
            dialogBio: false, isLoading: false, bio: auth.data.Bio,
          })}
          onConfirm={() => { this.setState({ isLoading: true }); this.submitBio(); }}
        >
          <div className="withdraw-dialog">
            <div style={{ margin: '0' }}>
              <Textarea
                rows={15}
                label="Your bio"
                placeholder="..."
                autoComplete="off"
                width="100%"
                value={bio}
                onChange={(e) => {
                  this.setState({ bio: e.target.value });
                }}
              />
            </div>
          </div>
        </Dialog>
        <Dialog
          isShown={dialogDCBProposal}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEscapePress={false}
          title="Create a DCB Proposal"
          confirmLabel="Submit"
          isConfirmLoading={isLoading}
          onCloseComplete={() => this.setState({
            dialogDCBProposal: false,
            isLoading: false,
          })}
          onConfirm={() => {
            this.setState({
              isLoading: true,
            });
            this.submitCreateDCB();
          }}
        >
          <Formik
            initialValues={{
              Name: '',
              dcbParams,
              ExecuteDuration: 0,
              Explanation: '',
            }}
            validate={(values) => {
              const errors = {};
              console.log(values);
              return errors;
            }}
            ref={(node) => {
              this.govForm = node;
              return null;
            }}
            validateOnBlur={false}
            validateOnChange={false}
            onSubmit={(values, { setSubmitting }) => {
              setTimeout(() => {
                this.submitCreateDCB(values, setSubmitting);
              }, 400);
            }}
          >
            {
              ({
                values,
                errors,
                touched,
                handleSubmit,
                setFieldValue,
              }) => (
                <form onSubmit={handleSubmit} className="proposal-submit-form">
                  <div>
                    <TextInputField
                      label="Name"
                      name="Name"
                      placeholder=""
                      value={values.Name}
                      onChange={(e) => {
                        setFieldValue('Name', e.target.value);
                      }}
                    />
                    {errors.Name && touched.Name && <span className="c-error">{errors.Name}</span>}
                  </div>
                  {'List sale'}
                  <FieldArray
                    name="dcbParams.ListSaleData"
                    render={arrayHelpers => (
                      <div>
                        {values.dcbParams.ListSaleData.map((sale, index) => (
                          <fieldset key={index}>
                            <legend>Sale</legend>
                            <div className="row">
                              <div className="col-12">
                                <TextInputField
                                  label="SaleID"
                                  name={`dcbParams.ListSaleData.${index}.SaleID`}
                                  placeholder=""
                                  value={values.dcbParams.ListSaleData[index]?.SaleID}
                                  onChange={(e) => {
                                    setFieldValue(`dcbParams.ListSaleData.${index}.SaleID`, e.target.value);
                                  }}
                                />
                                {
                                  errors.dcbParams?.ListSaleData[index]?.SaleID && touched.dcbParams?.ListSaleData[index]?.SaleID && (
                                    <span className="c-error">
                                      {errors.dcbParams?.ListSaleData[index]?.SaleID}
                                    </span>
                                  )
                                }
                                <TextInputField
                                  label="End block"
                                  name={`dcbParams.ListSaleData.${index}.EndBlock`}
                                  placeholder=""
                                  value={values.dcbParams.ListSaleData[index]?.EndBlock}
                                  onChange={(e) => {
                                    setFieldValue(`dcbParams.ListSaleData.${index}.EndBlock`, e.target.value);
                                  }}
                                />
                                {
                                  errors.dcbParams?.ListSaleData[index]?.EndBlock && touched.dcbParams?.ListSaleData[index]?.EndBlock && (
                                    <span className="c-error">
                                      {errors.dcbParams?.ListSaleData[index]?.EndBlock}
                                    </span>
                                  )
                                }
                                <TextInputField
                                  label="Buying asset"
                                  name={`dcbParams.ListSaleData.${index}.BuyingAsset`}
                                  placeholder=""
                                  value={values.dcbParams.ListSaleData[index]?.BuyingAsset}
                                  onChange={(e) => {
                                    setFieldValue(`dcbParams.ListSaleData.${index}.BuyingAsset`, e.target.value);
                                  }}
                                />
                                {
                                      errors.dcbParams?.ListSaleData[index]?.BuyingAsset && touched.dcbParams?.ListSaleData[index]?.BuyingAsset && (
                                        <span className="c-error">
                                          {errors.dcbParams?.ListSaleData[index]?.BuyingAsset}
                                        </span>
                                      )
                                    }
                                <TextInputField
                                  label="Buying amount"
                                  name={`dcbParams.ListSaleData.${index}.BuyingAmount`}
                                  placeholder=""
                                  value={values.dcbParams.ListSaleData[index]?.BuyingAmount}
                                  onChange={(e) => {
                                    setFieldValue(`dcbParams.ListSaleData.${index}.BuyingAmount`, e.target.value);
                                  }}
                                />
                                {
                                  errors.dcbParams?.ListSaleData[index]?.BuyingAmount && touched.dcbParams?.ListSaleData[index]?.BuyingAmount && (
                                    <span className="c-error">
                                      {errors.dcbParams?.ListSaleData[index]?.BuyingAmount}
                                    </span>
                                  )
                                }
                                <TextInputField
                                  label="Selling asset"
                                  name={`dcbParams.ListSaleData.${index}.SellingAsset`}
                                  placeholder=""
                                  value={values.dcbParams.ListSaleData[index]?.SellingAsset}
                                  onChange={(e) => {
                                    setFieldValue(`dcbParams.ListSaleData.${index}.SellingAsset`, e.target.value);
                                  }}
                                />
                                {
                                  errors.dcbParams?.ListSaleData[index]?.SellingAsset && touched.dcbParams?.ListSaleData[index]?.SellingAsset && (
                                    <span className="c-error">
                                      {errors.dcbParams?.ListSaleData[index]?.SellingAsset}
                                    </span>
                                  )
                                }
                                <TextInputField
                                  label="Selling amount"
                                  name={`dcbParams.ListSaleData.${index}.SellingAmount`}
                                  placeholder=""
                                  value={values.dcbParams.ListSaleData[index]?.SellingAmount}
                                  onChange={(e) => {
                                    setFieldValue(`dcbParams.ListSaleData.${index}.SellingAmount`, e.target.value);
                                  }}
                                />
                                {
                                  errors.dcbParams?.ListSaleData[index]?.SellingAmount && touched.dcbParams?.ListSaleData[index]?.SellingAmount && (
                                    <span className="c-error">
                                      {errors.dcbParams?.ListSaleData[index]?.SellingAmount}
                                    </span>
                                  )
                                }
                              </div>
                            </div>
                            <FontAwesomeIcon
                              style={{ cursor: 'pointer' }}
                              icon={faPlus}
                              onClick={() => {
                                arrayHelpers.push(dcbParams.ListSaleData[0]);
                              }}
                            />
                            {index > 0 ? (
                              <FontAwesomeIcon
                                style={{ cursor: 'pointer', marginLeft: 5 }}
                                icon={faMinus}
                                onClick={() => {
                                  arrayHelpers.remove(index);
                                }}
                              />
                            ) : ''}
                          </fieldset>
                        ))}
                      </div>
                    )}
                  />
                  <div className="row">
                    <div className="col-6">
                      <TextInputField
                        label="Min Loan response require"
                        name="dcbParams.MinLoanResponseRequire"
                        placeholder=""
                        value={values.dcbParams.MinLoanResponseRequire}
                        onChange={(e) => {
                          setFieldValue('dcbParams.MinLoanResponseRequire', e.target.value);
                        }}
                      />
                      {
                        errors.dcbParams?.MinLoanResponseRequire && touched.dcbParams?.MinLoanResponseRequire && (
                          <span className="c-error">
                            {errors.dcbParams?.MinLoanResponseRequire}
                          </span>
                        )
                      }
                    </div>
                    <div className="col-6">
                      <TextInputField
                        label="Min CMB approval require"
                        name="dcbParams.MinCMBApprovalRequire"
                        placeholder=""
                        value={values.dcbParams.MinCMBApprovalRequire}
                        onChange={(e) => {
                          setFieldValue('dcbParams.MinCMBApprovalRequire', e.target.value);
                        }}
                      />
                      {
                        errors.dcbParams?.MinCMBApprovalRequire && touched.dcbParams?.MinCMBApprovalRequire && (
                          <span className="c-error">
                            {errors.dcbParams?.MinCMBApprovalRequire}
                          </span>
                        )
                      }
                    </div>
                    <div className="col-6">
                      <TextInputField
                        label="Late withdraw response fine"
                        name="dcbParams.LateWithdrawResponseFine"
                        placeholder=""
                        value={values.dcbParams.LateWithdrawResponseFine}
                        onChange={(e) => {
                          setFieldValue('dcbParams.LateWithdrawResponseFine', e.target.value);
                        }}
                      />
                      {
                        errors.dcbParams?.LateWithdrawResponseFine && touched.dcbParams?.LateWithdrawResponseFine && (
                          <span className="c-error">
                            {errors.dcbParams?.LateWithdrawResponseFine}
                          </span>
                        )
                      }
                    </div>
                    <div className="col-12">
                      <fieldset>
                        <legend>Sale DCB tokens by USD</legend>
                        <div className="row">
                          <div className="col-6">
                            <TextInputField
                              label="Amount"
                              name="dcbParams.SaleDCBTokensByUSDData.Amount"
                              placeholder=""
                              value={values.dcbParams?.SaleDCBTokensByUSDData?.Amount}
                              onChange={(e) => {
                                setFieldValue('dcbParams.SaleDCBTokensByUSDData.Amount', e.target.value);
                              }}
                            />
                            {
                              errors.dcbParams?.SaleDCBTokensByUSDData?.Amount && touched.dcbParams?.SaleDCBTokensByUSDData?.Amount && (
                                <span className="c-error">
                                  {errors.dcbParams?.SaleDCBTokensByUSDData?.Amount}
                                </span>
                              )
                            }
                          </div>
                          <div className="col-6">
                            <TextInputField
                              label="End block"
                              name="dcbParams.SaleDCBTokensByUSDData.EndBlock"
                              placeholder=""
                              value={values.dcbParams.SaleDCBTokensByUSDData?.EndBlock}
                              onChange={(e) => {
                                setFieldValue('dcbParams.SaleDCBTokensByUSDData.EndBlock', e.target.value);
                              }}
                            />
                            {
                              errors.dcbParams?.SaleDCBTokensByUSDData?.EndBlock && touched.dcbParams?.SaleDCBTokensByUSDData?.EndBlock && (
                                <span className="c-error">
                                  {errors.dcbParams?.SaleDCBTokensByUSDData?.EndBlock}
                                </span>
                              )
                            }
                          </div>
                        </div>
                      </fieldset>
                    </div>
                  </div>
                  {/* ListLoanParams */}
                  <div>
                    <TextInputField
                      label="Execute duration"
                      name="ExecuteDuration"
                      placeholder=""
                      value={values.ExecuteDuration}
                      onChange={(e) => {
                        setFieldValue('ExecuteDuration', e.target.value);
                      }}
                    />
                    {errors.ExecuteDuration && touched.ExecuteDuration && <span className="c-error">{errors.ExecuteDuration}</span>}
                  </div>
                  <div>
                    <TextInputField
                      label="Explanation"
                      name="Explanation"
                      placeholder=""
                      value={values.Explanation}
                      onChange={(e) => {
                        setFieldValue('Explanation', e.target.value);
                      }}
                    />
                    {errors.Explanation && touched.Explanation && <span className="c-error">{errors.Explanation}</span>}
                  </div>
                </form>
              )
            }
          </Formik>
        </Dialog>
        <div className="coin-information">
          <div className="container">
            <div className="row">
              <div className="col-12 col-lg-8">
                <div className="c-card">
                  <div className="hello">
                    {`Hello, ${auth.data.FirstName}`}
                    <div className="edit" onClick={() => { this.setState({ dialogBio: true }); }}><FontAwesomeIcon icon={faEdit} /></div>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: `<p>${auth.data.Bio.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>` }} />
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="c-card card-create-a-proposal-container" style={{ backgroundImage: `url(${bgImage})` }}>
                  <p>
                    Wanna know how to loan Constant instantly
                    <br />
                    <i>Create new one.</i>
                  </p>
                  <button className="c-btn c-bg-green" type="button" onClick={() => { this.setState({ dialogDCBProposal: true }); }}>
                    {'DCB Proposal '}
                    <FontAwesomeIcon icon={faAngleRight} />
                  </button>
                  <button className="c-btn c-bg-green" type="button" onClick={() => { this.setState({ dialogGOVProposal: true }); }}>
                    {'GOV Proposal '}
                    <FontAwesomeIcon icon={faAngleRight} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="apply">
          <div className="container">
            <div className="row">
              <div className="col-12 col-lg-4">
                <div className="c-card" style={{ backgroundImage: `url(${bgApplyGOV})` }}>
                  <div className="title c-color-blue-1000">Apply GOV board</div>
                  <div className="description">Control the new internet</div>
                  <CheckInit inited={inited}>
                    <Link className={cn('c-btn', { active: candidate.GOVAppliedAt })} to="/" onClick={e => this.apply(2, e, candidate.GOVAppliedAt)}>
                      <Applied applied={candidate.GOVAppliedAt}>
                        <>
                          {'Apply now '}
                          <FontAwesomeIcon icon={faArrowRight} />
                        </>
                      </Applied>
                    </Link>
                  </CheckInit>
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="c-card" style={{ backgroundImage: `url(${bgApplyDCB})` }}>
                  <div className="title c-color-blue-1000">Apply DCB Board</div>
                  <div className="description">A decentralized bank</div>
                  <CheckInit inited={inited}>
                    <Link className={cn('c-btn', { active: candidate.DCBAppliedAt })} to="/" onClick={e => this.apply(1, e, candidate.DCBAppliedAt)}>
                      <Applied applied={candidate.DCBAppliedAt}>
                        <>
                          {'Apply now '}
                          <FontAwesomeIcon icon={faArrowRight} />
                        </>
                      </Applied>
                    </Link>
                  </CheckInit>
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="c-card" style={{ backgroundImage: `url(${bgApplyMCB})` }}>
                  <div className="title c-color-blue-1000">Apply MCB Board</div>
                  <div className="description">Lorem ipsum ador</div>
                  <CheckInit inited={inited}>
                    <Link className={cn('c-btn', { active: candidate.CMBAppliedAt })} to="/" onClick={e => this.apply(3, e, candidate.CMBAppliedAt)}>
                      <Applied applied={candidate.CMBAppliedAt}>
                        <>
                          {'Apply now '}
                          <FontAwesomeIcon icon={faArrowRight} />
                        </>
                      </Applied>
                    </Link>
                  </CheckInit>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(state => ({ auth: state.auth }), ({
  authCheckAuth: checkAuth,
}))(Home);
