function formatTimeDifference(milliseconds) {
    if (milliseconds < 1000) {
        return `${milliseconds} 毫秒`;
    }
    const totalSeconds = Math.floor(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    if (milliseconds < 60000) {
        return `${seconds} 秒`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    if (milliseconds < 3600000) {
        return `${minutes} 分 ${seconds} 秒`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (milliseconds < 86400000) {
        return `${hours} 小時 ${remainingMinutes} 分 ${seconds} 秒`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} 天 ${remainingHours} 小時 ${remainingMinutes} 分 ${seconds} 秒`;
}

module.exports = { formatTimeDifference };