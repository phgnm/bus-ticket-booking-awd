const { authenticateJWT } = require('../../src/middlewares/authMiddleware');
const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock process.env
process.env.JWT_ACCESS_SECRET = 'test-secret';

describe('Auth Middleware', () => {
    it('should return 401 if no token provided', () => {
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();
        const next = jest.fn();

        authenticateJWT(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res._getJSONData()).toEqual({
            msg: 'Authorization header missing or malformed',
        });
    });

    it('should call next() if token is valid', () => {
        const token = jwt.sign(
            {
                id: 1,
                role: 'user',
            },
            'test-secret',
        );

        const req = httpMocks.createRequest({
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        authenticateJWT(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(1);
        expect(next).toHaveBeenCalled();
    });
});
