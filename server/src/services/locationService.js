const locationRepository = require('../repositories/locationRepository');
const redisClient = require('../config/redis');

class LocationService {
    async getLocations(keyword) {
        // create key cache
        const cacheKey = keyword
            ? `locations:search:${keyword.trim().toLowerCase()}`
            : 'locations:all';

        // check redis
        if (redisClient.isOpen) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    return JSON.parse(cachedData);
                }
            } catch (error) {
                console.error('Redis error:', error);
            }
        }

        // if there's no cache, call repository
        const locations = await locationRepository.findAll(keyword);

        // save into redis for 1 hour
        if (redisClient.isOpen && locations.length > 0) {
            try {
                await redisClient.set(cacheKey, JSON.stringify(locations), {
                    EX: 3600,
                });
            } catch (error) {
                console.error('Redis error:', error);
            }
        }

        return locations;
    }

    async createLocation(data) {
        const location = await locationRepository.create(data);
        await redisClient.del('locations:all'); // Xóa cache
        return location;
    }

    async updateLocation(id, data) {
        const location = await locationRepository.update(id, data);
        await redisClient.del('locations:all');
        return location;
    }

    async deleteLocation(id) {
        await locationRepository.delete(id);
        await redisClient.del('locations:all');
    }
}

module.exports = new LocationService();
