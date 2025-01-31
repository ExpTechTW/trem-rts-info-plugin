const { showToast } = require('./toast');

function createStationListItem(stationId, stationInfo) {
    const listItem = document.createElement('div');
    listItem.className = 'station-list-item';

    const idSpan = document.createElement('span');
    idSpan.className = 'station-id';
    idSpan.textContent = stationId;

    const infoSpan = document.createElement('span');
    infoSpan.className = 'station-info';
    infoSpan.textContent = stationInfo;

    listItem.appendChild(idSpan);
    listItem.appendChild(infoSpan);

    listItem.addEventListener('click', () => {
        navigator.clipboard.writeText(stationId).then(() => {
            showToast('站台ID已複製');
        }).catch((err) => {
            console.error('Failed to copy:', err);
        });
    });

    return listItem;
}

function updateStationList(containerId, stations) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    Object.entries(stations).forEach(([id, info]) => {
        const listItem = createStationListItem(id, info);
        container.appendChild(listItem);
    });
}

module.exports = {
    createStationListItem,
    updateStationList
};