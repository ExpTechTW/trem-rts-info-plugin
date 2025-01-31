// Configuration for charts
const MAX_DATA_POINTS = 100; // Limit the number of data points to store

function limitDataPoints(dataArray) {
    if (dataArray.length > MAX_DATA_POINTS) {
        return dataArray.slice(-MAX_DATA_POINTS);
    }
    return dataArray;
}

module.exports = {
    MAX_DATA_POINTS,
    limitDataPoints
};