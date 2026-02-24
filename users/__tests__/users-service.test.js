import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../users-service.js'

describe('POST /createuser', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns a greeting message for the provided username', async () => {
        const res = await request(app)
            .post('/createuser')
            .send({ username: 'Pablo' })
            .set('Accept', 'application/json')

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('message')
        expect(res.body.message).toMatch(/User Pablo created successfully in MongoDB/i)
    })
})

describe('Logout flow', () => {

    afterEach(async () => {
        vi.restoreAllMocks()
        const User = mongoose.model('User')
        await User.deleteMany({})
    })

    it('crear usuario → logout → comprobar lastLogoutAt', async () => {

        const username = 'TestingUser'

        const createRes = await request(app)
            .post('/createuser')
            .send({ username })
            .set('Accept', 'application/json')

        expect(createRes.status).toBe(200)

        const logoutRes = await request(app)
            .post('/logout')
            .send({ username })
            .set('Accept', 'application/json')

        expect(logoutRes.status).toBe(200)
        expect(logoutRes.body).toHaveProperty('user')
        expect(logoutRes.body.user).toHaveProperty('lastLogoutAt')

        const logoutDate = new Date(logoutRes.body.user.lastLogoutAt)
        expect(Number.isNaN(logoutDate.getTime())).toBe(false)

        const User = mongoose.model('User')
        const userInDb = await User.findOne({ username }).lean()

        expect(userInDb).toBeTruthy()
        expect(userInDb.lastLogoutAt).toBeTruthy()
        expect(Number.isNaN(new Date(userInDb.lastLogoutAt).getTime())).toBe(false)
    })
})

