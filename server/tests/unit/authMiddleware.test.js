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


describe('Authorize Role Middleware', () => {
    /*
    const generateTokenWithRole = (role) => {
        return jwt.sign({ id: 1, role }, 'test-secret');
    };
    */

    // 1. successful test (admin route)
    it('should call next() if user role is authorized', () => {
        const authorizeAdmin = require('../../src/middlewares/authMiddleware').authorizeRole('admin');
        const req = httpMocks.createRequest({
            user: { id: 1, role: 'admin' }, // simulate req.user
        });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        authorizeAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.statusCode).toBe(200); 
    });

    // 2. successful test (user/admin route)
    it('should call next() if user role is in the list of authorized roles', () => {
        const authorizeUserAndAdmin = require('../../src/middlewares/authMiddleware').authorizeRole(['user', 'admin']);
        const req = httpMocks.createRequest({
            user: { id: 2, role: 'user' }, 
        });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        authorizeUserAndAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    // 3. fail test (user enters admin routes)
    it('should return 403 if user role is NOT authorized', () => {
        const authorizeAdmin = require('../../src/middlewares/authMiddleware').authorizeRole('admin');
        const req = httpMocks.createRequest({
            user: { id: 2, role: 'user' }, 
        });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        authorizeAdmin(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(res._getJSONData()).toEqual({
            msg: 'Access denied: insufficient permissions',
        });
        expect(next).not.toHaveBeenCalled();
    });
});