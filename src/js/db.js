import idb from 'idb' // indexedDB

export function setupDB() {
    //
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open('gtfs', 1, upgradeDb => {
        let stopStore = upgradeDb.createObjectStore('stops', {
            // The keyPath should be by stop_id, since there are at least 2 stop_ids
            //  for a stop_name. One for Northbound(NB) and one for Southbound(SB)
            keyPath: 'stop_id'
        })
        stopStore.createIndex('by-stop_name', 'stop_name')

        let stopTimeStore = upgradeDb.createObjectStore('stopTimes', {
            keyPath: ['stop_id', 'trip_id']
        })
        stopTimeStore.createIndex('by-stop_id', 'stop_id')
        stopTimeStore.createIndex('trip_order', ['trip_id', 'stop_sequence'])
        stopTimeStore.createIndex('by-trip_id', 'trip_id')
    })
}
