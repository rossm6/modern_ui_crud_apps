import React from 'react';
import ReactDOM from "react-dom";
import { Slider, Handles, Tracks, Rail } from 'react-compound-slider'
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

const sliderStyle = {  // Give the slider some width
    position: 'relative',
    width: '100%',
    height: 80,
    marginTop: 100
}

const railStyle = {
    position: 'absolute',
    width: '100%',
    height: 7,
    marginTop: 35,
    borderRadius: 5,
    backgroundColor: 'rgb(208 208 208)',
}

function Track({ source, target, getTrackProps }) {
    return (
        <div
            style={{
                position: 'absolute',
                height: 7,
                zIndex: 1,
                marginTop: 35,
                backgroundColor: '#007bff',
                borderRadius: 5,
                cursor: 'pointer',
                left: `${source.percent}%`,
                width: `${target.percent - source.percent}%`,
            }}
            {...getTrackProps() /* this will set up events if you want it to be clickeable (optional) */}
        />
    )
}

function Handle({
    handle: { id, value, percent },
    getHandleProps
}) {
    return (
        <div
            style={{
                left: `${percent}%`,
                position: 'absolute',
                marginLeft: -7.5,
                marginTop: 30,
                zIndex: 2,
                width: 15,
                height: 15,
                border: 0,
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: '50%',
                backgroundColor: '#007bff',
                color: '#333',
            }}
            {...getHandleProps(id)}
        >
            <div style={{ fontFamily: 'Roboto', fontSize: 11, marginTop: -35 }}>
                £{value}
            </div>
        </div>
    )
}


export default (props) => {
    <Slider
        rootStyle={sliderStyle}
        domain={[0, 1000000]}
        step={1}
        mode={2}
        values={[0, 1000000]}
    >
        <Rail>
            {({ getRailProps }) => (
                <div style={railStyle} {...getRailProps()} />
            )}
        </Rail>
        <Handles>
            {({ handles, getHandleProps }) => (
                <div className="slider-handles">
                    {handles.map(handle => (
                        <Handle
                            key={handle.id}
                            handle={handle}
                            getHandleProps={getHandleProps}
                        />
                    ))}
                </div>
            )}
        </Handles>
        <Tracks left={false} right={false}>
            {({ tracks, getTrackProps }) => (
                <div className="slider-tracks">
                    {tracks.map(({ id, source, target }) => (
                        <Track
                            key={id}
                            source={source}
                            target={target}
                            getTrackProps={getTrackProps}
                        />
                    ))}
                </div>
            )}
        </Tracks>
    </Slider>
};


ReactDOM.render(
    <Container>
        <Row>
            <Col md={4}>
                <Slider
                    rootStyle={sliderStyle}
                    domain={[0, 1000000]}
                    step={1}
                    mode={2}
                    values={[0, 1000000]}
                >
                    <Rail>
                        {({ getRailProps }) => (
                            <div style={railStyle} {...getRailProps()} />
                        )}
                    </Rail>
                    <Handles>
                        {({ handles, getHandleProps }) => (
                            <div className="slider-handles">
                                {handles.map(handle => (
                                    <Handle
                                        key={handle.id}
                                        handle={handle}
                                        getHandleProps={getHandleProps}
                                    />
                                ))}
                            </div>
                        )}
                    </Handles>
                    <Tracks left={false} right={false}>
                        {({ tracks, getTrackProps }) => (
                            <div className="slider-tracks">
                                {tracks.map(({ id, source, target }) => (
                                    <Track
                                        key={id}
                                        source={source}
                                        target={target}
                                        getTrackProps={getTrackProps}
                                    />
                                ))}
                            </div>
                        )}
                    </Tracks>
                </Slider>
            </Col>
        </Row>
    </Container>,
    document.getElementById('root')
);