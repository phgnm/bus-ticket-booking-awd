const locationRepository = require('../repositories/locationRepository');
const redisClient = require('../config/redis');

class LocationService {
    async getLocations(keyword) {
        // create key cache
        const cacheKey = keyword
            ? `locations:search:${keyword.trim().toLowerCase()}`
            : 'locations:all';

        // check redis
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // if there's no cache, call repository
        const locations = await locationRepository.findAll(keyword);

        // save into redis for 1 hour
        await redisClient.set(cacheKey, JSON.stringify(locations), {
            EX: 3600,
        });

        return locations;
    }
}

module.exports = new LocationService();
