import { Router } from "express";
import { SearchController } from "./search.controller";

const router = Router();

/**
 * @route   GET /api/v1/search/properties
 * @desc    Public property search for the landing page hero section
 * @access  Public (no auth required)
 *
 * @queryParams
 *  - searchTerm    {string}  Free-text search on address, zone, propertyType, description
 *  - propertyType  {string}  Filter by property type (e.g. "Commercial", "Residential")
 *  - vacancyStatus {string}  Filter by status (VACANT | UNDER_CONTRACT | CLOSED | COMPLETED | CANCELLED)
 *  - zone          {string}  Filter by zone
 *  - minPrice      {number}  Minimum asking price
 *  - maxPrice      {number}  Maximum asking price
 *  - page          {number}  Page number (default: 1)
 *  - limit         {number}  Results per page (default: 10, max: 20)
 */
router.get("/properties", SearchController.searchProperties);

export const SearchRoutes = router;
