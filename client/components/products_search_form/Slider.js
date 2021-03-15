import React from 'react';
import { Slider, Handles, Tracks, Rail } from 'react-compound-slider'

const sliderStyle = {  // Give the slider some width
    position: 'relative',
    width: '100%',
    height: 40,
}

const railStyle = {
    position: 'absolute',
    width: '100%',
    height: 7,
    marginTop: 25,
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
                marginTop: 25,
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
    getHandleProps,
    prefix,
    leftToolTip
}) {

    // right most tooltip should have margin left to avoid overlapping container (likely a form container)
    const marginLeft = leftToolTip ? -30 : 0;

    return (
        <div
            style={{
                left: `${percent}%`,
                position: 'absolute',
                marginLeft: -7.5,
                marginTop: 20,
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
            <div style={{ fontFamily: 'Roboto', fontSize: 11, marginTop: -25, marginLeft, fontWeight: 900 }}>
                {prefix}{value}
            </div>
        </div>
    )
}

export default ({ lower, upper, initialStart, initialEnd, onChange, handlePrefix }) => {
    handlePrefix = handlePrefix || "";

    return (
        <Slider
            rootStyle={sliderStyle}
            domain={[lower, upper]}
            step={1}
            mode={2}
            values={[initialStart, initialEnd]}
            onChange={onChange}
        >
            <Rail>
                {({ getRailProps }) => (
                    <div style={railStyle} {...getRailProps()} />
                )}
            </Rail>
            <Handles>
                {({ handles, getHandleProps }) => (
                    <div className="slider-handles">
                        {handles.map((handle, i) => (
                            <Handle
                                key={handle.id}
                                handle={handle}
                                getHandleProps={getHandleProps}
                                prefix={handlePrefix}
                                leftToolTip={handles.length - 1 == i}
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
    )
};