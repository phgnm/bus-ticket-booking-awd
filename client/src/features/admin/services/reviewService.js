import api from '@/lib/api';

export const reviewService = {
    // Lấy danh sách review với filter & pagination
    getReviews: async (params) => {
        const { page = 1, limit = 10, search, rating, status, startDate, endDate } = params;
        const query = new URLSearchParams({
            page,
            limit,
            ...(search && { search }),
            ...(rating && { rating }),
            ...(status && { status }),
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
        });

        const response = await api.get(`/admin/reviews?${query.toString()}`);
        return response.data; // Expected: { data: [], total: 0, totalPages: 0 }
    },

    // Xóa review (Soft delete)
    deleteReview: async (id) => {
        return await api.delete(`/admin/reviews/${id}`);
    },

    
};