import _ from 'lazy.js'


const parse = (extractValues) => (csv) =>
    Promise.resolve(
        _(csv)
            .split("\n")
            .skip(1)
            .initial()
            .map(extractValues)
    )


const extractStop = line => {
    let values = line.split(",")
    return {
        stop_id: values[1],     // Actually the stop_code column
        stop_name: values[2],
        platform_code: values[9]
    }
}
export const parseStops = parse(extractStop)


const extractStopTimes = line => {
    let values = line.split(",")
    return {
        trip_id : values[0],
        arrival_time : values[1],
        departure_time : values[2],
        stop_id : values[3],
        stop_sequence : parseInt(values[4], 10)
    }
}
export const parseStopTimes = parse(extractStopTimes)
