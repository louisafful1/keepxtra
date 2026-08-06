import { Router } from 'express'
import { authRouter } from './auth.routes'
import { farmerRouter } from './farmer.routes'
import { storageRequestRouter } from './storageRequest.routes'
import { pickupRouter } from './pickup.routes'
import { warehouseRouter } from './warehouse.routes'
import { coldRoomRouter } from './coldRoom.routes'
import { inventoryRouter } from './inventory.routes'
import { qualityInspectionRouter } from './qualityInspection.routes'
import { vehicleRouter } from './vehicle.routes'
import { driverRouter } from './driver.routes'
import { customerRouter } from './customer.routes'
import { orderRouter } from './order.routes'
import { payoutRouter } from './payout.routes'
import { notificationRouter } from './notification.routes'
import { reportRouter } from './report.routes'

/**
 * Versioned API root. Every business module — Auth, Farmers, Storage
 * Requests, Pickups, Warehouses, Cold Rooms, Inventory, Quality
 * Inspections, Vehicles, Drivers, Customers, Orders, Payouts,
 * Notifications, and Reports — is mounted below.
 */
export const apiRouter = Router()

apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    name: 'KeepXtra API',
    version: '0.1.0',
    status:
      'auth + farmers + storage-requests + pickups + warehouses + cold-rooms + inventory + quality-inspections + fleet + sales + payments + notifications + reports modules live',
  })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/farmers', farmerRouter)
apiRouter.use('/storage-requests', storageRequestRouter)
apiRouter.use('/pickups', pickupRouter)
apiRouter.use('/warehouses', warehouseRouter)
apiRouter.use('/cold-rooms', coldRoomRouter)
apiRouter.use('/inventory', inventoryRouter)
apiRouter.use('/quality-inspections', qualityInspectionRouter)
apiRouter.use('/vehicles', vehicleRouter)
apiRouter.use('/drivers', driverRouter)
apiRouter.use('/customers', customerRouter)
apiRouter.use('/orders', orderRouter)
apiRouter.use('/payouts', payoutRouter)
apiRouter.use('/notifications', notificationRouter)
apiRouter.use('/reports', reportRouter)
