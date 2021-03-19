import React, { forwardRef } from 'react';
import { Formik, Field } from 'formik';
import * as Yup from 'yup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import PropTypes from 'prop-types';
import DatePicker from "react-datepicker";
import DropdownMultiselect from "react-multiselect-dropdown-bootstrap"; // may be better - https://github.com/harshzalavadiya/react-multi-select-component#readme
import Slider from "./Slider";

import "react-datepicker/dist/react-datepicker.css";
import "./style.css";

/*

    TODO -

        Rightside Date Pickers go off the page on small screens.

        Need to make changes to DropdownMultiSelect fork I took.
            -   enhancement request: onBlur
            -   bug: add "type"="button" to "SelectAll" button.
            -   option to specify the prefix for IDs.  At the moment
                multiple widgets will cause ID not unique error.

        We could really do with improving the fields.  Take a
        look at Select for example.  It seems lots of things aren't used
        in the component.  I WAS CONFUSED ABOUT <Field>.  This is a
        formik component which makes more sense.

*/


const DateTimePickerRange = (props) => {
    const formik = props.formik;
    const startDateFieldName = props.startDateFieldName;
    const endDateFieldName = props.endDateFieldName;

    // validation messages have been ignored because
    // the error cannot enter an invalid date range
    // given component set up
    // and blank is fine as well

    const CustomInput = forwardRef(({ value, onClick }, ref) => (
        <Form.Control onClick={onClick} onChange={() => {}} ref={ref} value={value} />
    ));

    CustomInput.propTypes = {
        value: PropTypes.string,
        onClick: PropTypes.func
    }

    CustomInput.displayName = "DateTimePickerRangeInput";

    const onStartDateChange = (fieldValue) => {
        formik.setFieldValue(startDateFieldName, fieldValue);
    };

    const onEndDateChange = (fieldValue) => {
        formik.setFieldValue(endDateFieldName, fieldValue);
    };

    const onStartDateBlur = () => {
        formik.setFieldTouched(startDateFieldName, true);
    };

    const onEndDateBlur = () => {
        formik.setFieldTouched(endDateFieldName, true);
    };

    return (
        <Form.Row>
            <Form.Group as={Col}>
                <Form.Label className="font-weight-bold">{props.startDateFieldLabel}</Form.Label>
                <DatePicker
                    selected={formik.values[startDateFieldName] || null}
                    onChange={date => onStartDateChange(date)}
                    onBlur={onStartDateBlur}
                    selectsStart
                    startDate={formik.values[startDateFieldName] || null}
                    endDate={formik.values[endDateFieldName] || null}
                    customInput={<CustomInput />}
                />
            </Form.Group>
            <Form.Group as={Col}>
                <Form.Label className="font-weight-bold">{props.endDateFieldLabel}</Form.Label>
                <DatePicker
                    selected={formik.values[endDateFieldName] || null}
                    onChange={date => onEndDateChange(date)}
                    onBlur={onEndDateBlur}
                    selectsEnd
                    startDate={formik.values[startDateFieldName] || null}
                    endDate={formik.values[endDateFieldName] || null}
                    minDate={formik.values[startDateFieldName] || null}
                    customInput={<CustomInput />}
                />
            </Form.Group>
        </Form.Row>
    )
};


DateTimePickerRange.propTypes = {
    formik: PropTypes.object,
    startDateFieldLabel: PropTypes.string,
    startDateFieldName: PropTypes.string,
    endDateFieldLabel: PropTypes.string,
    endDateFieldName: PropTypes.string
};


const InputForRange = ({ type, label, name, formik }) => {
    return (
        <Form.Group as={Col}>
            <Form.Label className="font-weight-bold">{label}</Form.Label>
            <Field name={name}>
                {
                    ({ field }) => (
                        <Form.Control
                            type={type}
                            // isValid={formik.touched[name] && !formik.errors[name]}
                            isInvalid={formik.touched[name] && !!formik.errors[name]}
                            {...field}
                        />
                    )
                }
            </Field>
            {/* <Form.Control.Feedback>Looks good!</Form.Control.Feedback> */}
            <Form.Control.Feedback type="invalid">{formik.errors[name]}</Form.Control.Feedback>
        </Form.Group>
    )
};


InputForRange.propTypes = {
    type: PropTypes.string,
    label: PropTypes.string,
    name: PropTypes.string,
    formik: PropTypes.object
};


const RangeInputs = (
    {
        type,
        formik,
        from_label,
        from_name,
        to_label,
        to_name,
        lower,
        upper,
        initialStart,
        initialEnd,
        sliderToolTipPrefix
    }
) => {
    return (
        <Form.Row>
            <InputForRange
                type={type}
                label={from_label}
                name={from_name}
                formik={formik}
            />
            <InputForRange
                type={type}
                label={to_label}
                name={to_name}
                formik={formik}
            />
            <div className="w-100"></div>
            <Form.Group className="px-2 w-100">
                <Slider
                    lower={lower}
                    upper={upper}
                    initialStart={formik.values[from_name] || initialStart}
                    initialEnd={formik.values[to_name] || initialEnd}
                    onChange={(vals) => {
                        const [lower, upper] = vals;
                        formik.setFieldValue(from_name, lower, false); // false means do not trigger validation
                        formik.setFieldValue(to_name, upper); // do it now (true is the default)
                    }}
                    handlePrefix={sliderToolTipPrefix}
                />
            </Form.Group>
        </Form.Row>
    );
};


RangeInputs.propTypes = {
    type: PropTypes.string,
    formik: PropTypes.object,
    from_label: PropTypes.string,
    from_name: PropTypes.string,
    to_label: PropTypes.string,
    to_name: PropTypes.string,
    lower: PropTypes.number,
    upper: PropTypes.number,
    initialStart: PropTypes.number,
    initialEnd: PropTypes.number,
    sliderToolTipPrefix: PropTypes.string,
};


const SelectMultiple = (props) => {
    return (
        <Field name={props.name}>
            {
                () => (
                    <DropdownMultiselect
                        selected={props.selected}
                        options={props.options}
                        name="listing"
                        handleOnChange={(val) => props.formik.setFieldValue(props.name, val)}
                    />
                )
            }
        </Field>
    )
};

SelectMultiple.propTypes = {
    selected: PropTypes.array,
    name: PropTypes.string,
    options: PropTypes.array,
    formik: PropTypes.object,
};

const formatDate = (date) => {
    return date.toLocaleDateString('en-GB')
};

const ProductSearchForm = ({ setSubmissionData }) => {

    return (
        <Formik
            initialValues={{
                fromSquare: '',
                toSquare: '',
                fromPrice: '',
                toPrice: '',
                startDateRange: '',
                endDateRange: '',
                duration: [
                    'd1',
                    'd2',
                    'd3',
                    'd4',
                    'd5',
                    'd6',
                    'd7'
                ],
                listing: ['l', 's']
            }}
            validationSchema={
                Yup.object().shape({
                    fromSquare: Yup.number().min(1).max(1000).nullable(),
                    toSquare: (
                        Yup
                            .number()
                            .min(1)
                            .max(1000)
                            .nullable()
                            .when('fromSquare', (fromSquare, schema) => {
                                return (!isNaN(fromSquare)) ? schema.min(fromSquare, 'Cannot be less than fromSquare') : schema.min(1)
                            })
                    ),
                    fromPrice: Yup.number().min(0, "I'm not that stupid!").max(1000000, "I wish!").nullable(),
                    toPrice: (
                        Yup
                            .number()
                            .min(0, "I'm not that stupid!")
                            .max(1000000, "I wish!")
                            .nullable()
                            .when('fromPrice', (fromPrice, schema) => {
                                return (!isNaN(fromPrice)) ? schema.min(fromPrice, 'Cannot be less than fromPrice') : schema.min(0, "I'm not that stupid!")
                            })
                    ),
                    // // fromStart: Yup.string().nullable(),
                    // // toStart: (
                    // //     Yup
                    // //         .string()
                    // //         .nullable()
                    // //         .when('fromStart', (fromStart, schema) => {
                    // //             //
                    // //         })
                    // // ),
                    // // fromEnd: Yup.string().nullable(),
                    // // toEnd: (
                    // //     Yup
                    // //         .string()
                    // //         .nullable()
                    // //         .when('fromEnd', (fromStart, schema) => {
                    // //             //
                    // //         })
                    // // ),
                    duration: (
                        Yup.array()
                            .required()
                            .of(Yup.string())
                            .test({
                                name: 'required',
                                test: function (vals) {
                                    if (vals && vals.length) {
                                        return true;
                                    }
                                    return false;
                                },
                                message: "You must choose at least one option."
                            })
                    ),
                    listing: (
                        Yup.array()
                            .required()
                            .of(Yup.string())
                            .test({
                                name: 'required',
                                test: function (vals) {
                                    if (vals && vals.length) {
                                        return true;
                                    }
                                    return false;
                                },
                                message: "You must choose at least one option."
                            })
                            .test({
                                name: 'choices',
                                test: function (vals) {
                                    let error = false;
                                    vals.forEach((v) => {
                                        if (['l', 's'].indexOf(v) == -1) {
                                            error = true;
                                            return;
                                        }
                                    });
                                    return error == false;
                                },
                                message: "Choices are lease or sale"
                            })
                    )
                })
            }
            onSubmit={(values) => {
                // we need to conver the date objects before making the API request
                let dates = {
                    fromStartDate: values.fromStartDate,
                    toStartDate: values.toStartDate,
                    fromEndDate: values.fromEndDate,
                    toEndDate: values.toEndDate
                };
                for (var key in dates) {
                    if (dates[key] instanceof Date) {
                        values[key] = formatDate(dates[key]);
                    }
                }
                // "" is a default for all fields
                // do not send these field values to the server
                var submissionValues = {};
                for (key in values) {
                    if (values[key]) {
                        submissionValues[key] = values[key];
                    }
                }
                setSubmissionData(submissionValues);
            }}
        >
            {formik => {
                return (
                    <Row>
                        <Col>
                            <Form noValidate onSubmit={formik.handleSubmit} className="mt-5 border p-2 rounded">
                                <RangeInputs
                                    from_label="From Square"
                                    from_name="fromSquare"
                                    to_label="To Square"
                                    to_name="toSquare"
                                    formik={formik}
                                    type='number'
                                    lower={1}
                                    upper={1000}
                                    initialStart={1}
                                    initialEnd={1000}
                                />
                                <RangeInputs
                                    from_label="From Price"
                                    from_name="fromPrice"
                                    to_label="To Price"
                                    to_name="toPrice"
                                    formik={formik}
                                    type='number'
                                    lower={0}
                                    upper={1000000}
                                    initialStart={0}
                                    initialEnd={1000000}
                                    sliderToolTipPrefix="£"
                                />
                                <DateTimePickerRange
                                    formik={formik}
                                    startDateFieldLabel="From Start Date"
                                    startDateFieldName="fromStartDate"
                                    endDateFieldName="toStartDate"
                                    endDateFieldLabel="To Start Date"
                                />
                                <DateTimePickerRange
                                    formik={formik}
                                    startDateFieldLabel="From End Date"
                                    startDateFieldName="fromEndDate"
                                    endDateFieldLabel="To End Date"
                                    endDateFieldName="toEndDate"
                                />
                                <Form.Row>
                                    <Form.Group as={Col}>
                                        <Form.Label className="font-weight-bold">Duration</Form.Label>
                                        <SelectMultiple
                                            name="duration"
                                            selected={[
                                                'd1',
                                                'd2',
                                                'd3',
                                                'd4',
                                                'd5',
                                                'd6',
                                                'd7'
                                            ]}
                                            options={[
                                                { key: "d1", label: "1 day" },
                                                { key: "d2", label: "2 days" },
                                                { key: "d3", label: "3 days" },
                                                { key: "d4", label: "4 days" },
                                                { key: "d5", label: "5 days" },
                                                { key: "d6", label: "6 days" },
                                                { key: "d7", label: "7 days" },
                                            ]}
                                            formik={formik}
                                        />
                                        {formik.errors.duration && <div className='text-danger small mt-1'>{formik.errors.duration}</div>}
                                    </Form.Group>
                                </Form.Row>
                                <Form.Row>
                                    <Form.Group as={Col}>
                                        <Form.Label className="font-weight-bold">Listing</Form.Label>
                                        <SelectMultiple
                                            name="listing"
                                            selected={['l', 's']}
                                            options={[{ key: "l", label: "Lease" }, { key: "s", label: "Sale" }]}
                                            formik={formik}
                                        />
                                        {/*
                                                Implement this when enhancement request has been done -
                                                https://github.com/kfrancikowski/react-multiselect-dropdown-bootstrap/issues/13
                                                So we can easily add listing to formik.touched

                                                {formik.values.listing && <div className='text-success small mt-1'>Looks good!</div>} 
                                            */}
                                        {formik.errors.listing && <div className='text-danger small mt-1'>{formik.errors.listing}</div>}
                                    </Form.Group>
                                </Form.Row>
                                <Button
                                    variant="success"
                                    block
                                    type="submit"
                                >
                                    Search
                                </Button>
                            </Form>
                        </Col>
                    </Row>
                )
            }}
        </Formik >
    )
};

ProductSearchForm.propTypes = {
    setSubmissionData: PropTypes.func
};

export default ProductSearchForm;