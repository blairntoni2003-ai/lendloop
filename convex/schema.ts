import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
users: defineTable({
clerkId: v.string(),
name: v.string(),
email: v.string(),
role: v.union(v.literal("user"), v.literal("admin")),
isTrustedLender: v.boolean(),
}).index("by_clerkId", ["clerkId"]),
tools: defineTable({
name: v.string(),
category: v.string(),
condition: v.string(),
description: v.string(),
ownerId: v.id("users"),
isAvailable: v.boolean(),
})
.index("by_ownerId", ["ownerId"])
.index("by_category", ["category"])
.index("by_isAvailable", ["isAvailable"]),
loans: defineTable({
toolId: v.id("tools"),
borrowerId: v.id("users"),
ownerId: v.id("users"),
startDate: v.number(),
endDate: v.number(),
status: v.union(
v.literal("pending"),
v.literal("approved"),
v.literal("rejected"),
v.literal("returned"),
),
reminderSent: v.boolean(),
})
.index("by_toolId", ["toolId"])
.index("by_borrowerId", ["borrowerId"])
.index("by_ownerId", ["ownerId"])
.index("by_overdue", ["status", "reminderSent", "endDate"]),
});