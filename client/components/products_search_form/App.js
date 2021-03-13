import React, { useState } from 'react';
import { Formik, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';


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
                fromStart: '',
                toStart: '',
                duration: '',
                fromEnd: '',
                toEnd: '',
                listing: '',
            }}
            validationSchema={
                Yup.object({
                    fromSquare: Yup.number().min(1).max(1000).nullable(),
                    toSquare: (
                        Yup
                            .number()
                            .min(1)
                            .max(1000)
                            .nullable()
                            .when('fromSquare', (fromSquare, schema) => {
                                return (!isNaN(fromSquare)) ? schema.min(fromSquare, 'Cannot be less than fromSquare') : null
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
                                return (!isNaN(fromPrice)) ? schema.min(fromPrice, 'Cannot be less than fromPrice') : null
                            })
                    ),
                })
            }
        >
            {formik => (
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
                                {
                                    RangeInputs(
                                        {
                                            from_label: "From Start",
                                            from_name: "fromStart",
                                            to_label: "To Start",
                                            to_name: "toStart",
                                            formik,
                                            type: 'text'
                                        }
                                    )
                                }
                                {
                                    RangeInputs(
                                        {
                                            from_label: "From End",
                                            from_name: "fromEnd",
                                            to_label: "To End",
                                            to_name: "toEnd",
                                            formik,
                                            type: 'text'
                                        }
                                    )
                                }
                            </Form>
                        </Col>
                    </Row>
                </Container>
            )}
        </Formik>
    )
};

export default ProductSearchForm;