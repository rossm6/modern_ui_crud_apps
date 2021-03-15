import React, { useState, forwardRef } from 'react';
import { Formik, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import DatePicker from "react-datepicker";
// import { parse } from "date-fns/parse"; was going to use this for parsing the datetime string
// still might need it for the dates
import DropdownMultiselect from "react-multiselect-dropdown-bootstrap"; // may be better - https://github.com/harshzalavadiya/react-multi-select-component#readme

import "react-datepicker/dist/react-datepicker.css";
import "./style.css";

/*

    TODO -

    Change functions to function components i.e. use a props param at least.

    We could really do with improving the fields.  Take a
    look at Select for example.  It seems lots of things aren't used
    in the component.  I WAS CONFUSED ABOUT <Field>.  This is a
    formik component which makes more sense.

    I cannot get the multiselect to validate that at least one is chosen
    from the array.

*/


// const FormikRangePicker = (props) => {
//     const formik = props.formik;

//     const onChange = (fieldValue) => {
//         // fieldValue is [momemt, moment]
//         // moment is a moment js object
//         formik.setFieldValue(props.name, fieldValue);
//     };

//     const onBlur = (e) => {
//         formik.setFieldTouched(props.name, true);
//     };

//     let c = null;
//     if (formik.touched[props.name]) {
//         if (!formik.errors[props.name]) {
//             c = "border-success";
//         }
//         else {
//             c = "border-danger";
//         }
//     }

//     return (
//         <>
//             <DatePicker.RangePicker
//                 name={props.name}
//                 showTime={{ format: 'HH:mm' }}
//                 format="YYYY-MM-DD HH:mm"
//                 size="large"
//                 onChange={onChange}
//                 className={c}
//                 onBlur={onBlur}
//             />
//             {
//                 formik.touched[props.name]
//                 && !formik.errors[props.name]
//                 && <div className="mt-1 text-success small">Looks good!</div>
//             }
//             {
//                 formik.errors[props.name]
//                 && <div className="mt-1 text-danger small">{formik.errors[props.name]}</div>
//             }
//         </>
//     )
// };



const DateTimePickerRange = (props) => {
    const formik = props.formik;
    const startDateFieldName = props.startDateFieldName;
    const endDateFieldName = props.endDateFieldName;

    // validation messages have been ignored because
    // the error cannot enter an invalid date range
    // given component set up
    // and blank is fine as well

    const CustomInput = forwardRef(({ value, onClick }, ref) => (
        <Form.Control onClick={onClick} ref={ref} value={value} />
    ));

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
                <Form.Label>{props.startDateFieldLabel}</Form.Label>
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
                <Form.Label>{props.endDateFieldLabel}</Form.Label>
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

const Select = ({ label, name, formik, children }) => {
    return (
        <>
            <Form.Label>{label}</Form.Label>
            <Field name={name}>
                {
                    ({
                        field,
                        form: { touched, errors },
                        meta
                    }) => (
                        <Form.Control
                            as="select"
                            isValid={formik.touched[name] && !formik.errors[name]}
                            isInvalid={formik.touched[name] && !!formik.errors[name]}
                            {...field}
                        >
                            {children}
                        </Form.Control>
                    )
                }
            </Field>
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">{formik.errors[name]}</Form.Control.Feedback>
        </>
    )
};

const InputForRange = (type = "text", label, name, formik) => {
    return (
        <Form.Group as={Col}>
            <Form.Label>{label}</Form.Label>
            <Field name={name}>
                {
                    ({
                        field,
                        form: { touched, errors },
                        meta
                    }) => (
                        <Form.Control
                            type={type}
                            isValid={formik.touched[name] && !formik.errors[name]}
                            isInvalid={formik.touched[name] && !!formik.errors[name]}
                            {...field}
                        />
                    )
                }
            </Field>
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            <Form.Control.Feedback type="invalid">{formik.errors[name]}</Form.Control.Feedback>
        </Form.Group>
    )
};


const RangeInputs = ({ type, formik, from_label, from_name, to_label, to_name }) => {
    return (
        <Form.Row>
            {InputForRange(type, from_label, from_name, formik)}
            {InputForRange(type, to_label, to_name, formik)}
        </Form.Row>
    );
};


const ProductSearchForm = () => {

    return (
        <Formik
            initialValues={{
                fromSquare: '',
                toSquare: '',
                fromPrice: '',
                toPrice: '',
                startDateRange: '',
                endDateRange: '',
                duration: '',
                listing: ['l', 's']
            }}
            validationSchema={
                Yup.object().shape({
                    // fromSquare: Yup.number().min(1).max(1000).nullable(),
                    // toSquare: (
                    //     Yup
                    //         .number()
                    //         .min(1)
                    //         .max(1000)
                    //         .nullable()
                    //         .when('fromSquare', (fromSquare, schema) => {
                    //             return (!isNaN(fromSquare)) ? schema.min(fromSquare, 'Cannot be less than fromSquare') : schema.min(1)
                    //         })
                    // ),
                    // fromPrice: Yup.number().min(0, "I'm not that stupid!").max(1000000, "I wish!").nullable(),
                    // toPrice: (
                    //     Yup
                    //         .number()
                    //         .min(0, "I'm not that stupid!")
                    //         .max(1000000, "I wish!")
                    //         .nullable()
                    //         .when('fromPrice', (fromPrice, schema) => {
                    //             return (!isNaN(fromPrice)) ? schema.min(fromPrice, 'Cannot be less than fromPrice') : schema.min(0, "I'm not that stupid!")
                    //         })
                    // ),
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
                    // duration: Yup.string().nullable().oneOf(["1d", "2d", "3d", "4d", "5d", "6d", "7d"], "Choose a valid duration.  Any day from 1 to 7 days."),
                    listing: Yup.array().required().of(Yup.string()).test({
                        name: 'multipleSelect',
                        test: (vals) => {
                            console.log(vals);
                            let error = false;
                            vals.forEach((v) => {
                                if(["l", "s"].indexOf(v) == -1){
                                    error = true;
                                    return;
                                }
                            });
                            return error == false;
                        },
                        message: "Choices are lease or sale"
                    })
                })
            }
        >
            {formik => {
                console.log("formik", formik);
                return (
                    <Container>
                        <Row>
                            <Col>
                                <Form>
                                    {
                                        RangeInputs(
                                            {
                                                from_label: "From Square",
                                                from_name: "fromSquare",
                                                to_label: "To Square",
                                                to_name: "toSquare",
                                                formik,
                                                type: 'number'
                                            }
                                        )
                                    }
                                    {
                                        RangeInputs(
                                            {
                                                from_label: "From Price",
                                                from_name: "fromPrice",
                                                to_label: "To Price",
                                                to_name: "toPrice",
                                                formik,
                                                type: 'number'
                                            }
                                        )
                                    }
                                    {/* <DateTimePickerRange
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
                                    /> */}
                                    <Form.Row>
                                        <Form.Group as={Col}>
                                            <Select label="Duration" name="duration" formik={formik}>
                                                <option value="">---------</option>
                                                <option value="1d">1 day</option>
                                                <option value="2d">2 days</option>
                                                <option value="3d">3 days</option>
                                                <option value="4d">4 days</option>
                                                <option value="5d">5 days</option>
                                                <option value="6d">6 days</option>
                                                <option value="7d">7 days</option>
                                            </Select>
                                        </Form.Group>
                                    </Form.Row>
                                    <Form.Row>
                                        <Form.Group>
                                            <Form.Label>Listing</Form.Label>
                                            <Field name="listing">
                                                {
                                                    ({
                                                        field,
                                                        form: { touched, errors },
                                                        meta
                                                    }) => (
                                                        <DropdownMultiselect
                                                            selected={["l", "s"]}
                                                            options={[{ key: "l", label: "Lease" }, { key: "s", label: "Sale" }]}
                                                            name="listing"
                                                            handleOnChange={(val) => formik.setFieldValue('listing', val)}
                                                        />
                                                    )
                                                }
                                            </Field>
                                            {/* {formik.errors.listing && <div className="small text-danger mt-1">{formik.errors.listing}</div>} */}
                                            {formik.values.listing}
                                            {formik.errors.listing}
                                        </Form.Group>
                                    </Form.Row>
                                </Form>
                            </Col>
                        </Row>
                    </Container>
                )
            }}
        </Formik>
    )
};

export default ProductSearchForm;