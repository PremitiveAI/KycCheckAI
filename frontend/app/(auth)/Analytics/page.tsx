"use client";

import { DashboardLayout } from "@/app/(main)/dashboard/DashboardLayout";
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Bar, BarChart, PieChart, Pie, Cell } from "recharts";
import { useContainerReady } from "@/app/hooks/useContainerReady";
import { SkeletonGraph, SkeletonPie } from "@/app/components/loader";
import useNetworkStatus from "@/app/hooks/useNetworkStatus";



export default function analytics() {
     const isOnline = useNetworkStatus(); 
    
    const { ref: lineRef, ready: lineReady } = useContainerReady();
    const { ref: barRef, ready: barReady } = useContainerReady();
    const { ref: pieRef, ready: pieReady } = useContainerReady();
    const data = [
        { name: "Jan", value: 40 },
        { name: "Feb", value: 150 },
        { name: "Mar", value: 35 },
        { name: "Apr", value: 50 },
        { name: "May", value: 35 },
        { name: "Jun", value: 70 },
        { name: "Jul", value: 90 },
        { name: "Aug", value: 35 },
        { name: "Sep", value: 50 },
        { name: "Oct", value: 35 },
        { name: "Nov", value: 70 },
        { name: "Dec", value: 90 },
    ];

    const RADIAN = Math.PI / 180;

    // 1️⃣ VALUE INSIDE SLICE
    const renderInnerValue = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        value,
    }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) / 2;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="#FFFFFF"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="14"
                fontWeight="600"
            >
                {value}
            </text>
        );
    };

    // 2️⃣ NAME OUTSIDE SLICE
    const renderOuterName = ({
        cx,
        cy,
        midAngle,
        outerRadius,
        name,
    }: any) => {
        const radius = outerRadius + 20;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="#FFFFFF"
                fontSize="12"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
            >
                {name}
            </text>
        );
    };


    const pieData = [
        { name: "Policies Sold", value: 300 },
        { name: "New Leads", value: 120 },
        { name: "Renewals", value: 180 },
        { name: "Claims Processed", value: 90 },
    ];

    const COLORS = ["#5B9CFF", "#9C6CFF", "#FF6BCD", "#4BE1C3"];

    return (

        <DashboardLayout>
            <div className="grid grid-cols-1 xl:grid-cols-3 p-2 gap-6 w-full">

                {/* LEFT SECTION */}
                <div className="col-span-1 xl:col-span-2 flex flex-col gap-6">

                    {/* LINE CHART */}
                    <div
                        ref={lineRef}
                        className="rounded-2xl border border-[#FFFFFF1A] bg-[#FFFFFF0D] p-5 
                              h-[200px] sm:h-[240px] md:h-[280px]" >

                        <h2 className="text-white text-lg font-semibold mb-3">Yearly Performance</h2>

                        {!lineReady ? (
                            <SkeletonGraph />   // show loader
                        ) : (
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF1A" />
                                    <XAxis dataKey="name" stroke="#FFFFFF99" tick={{ fill: "#FFFFFF99" }} />
                                    <YAxis stroke="#FFFFFF99" tick={{ fill: "#FFFFFF99" }} />

                                    <Tooltip
                                        contentStyle={{
                                            background: "#0F0F0F",
                                            border: "1px solid #FFFFFF1A",
                                            borderRadius: "12px",
                                            color: "#FFFFFF",
                                        }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#5B9CFF"
                                        strokeWidth={3}
                                        dot={{
                                            r: 4,
                                            strokeWidth: 2,
                                            fill: "#FFFFFF33",
                                            stroke: "#5B9CFF",
                                        }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* BAR CHART */}
                    <div
                        ref={barRef}
                        className="rounded-2xl border border-[#FFFFFF1A] bg-[#FFFFFF0D] p-5 
                        h-[200px] sm:h-[240px] md:h-[280px] custom-bar-highlight" >

                        <h2 className="text-white text-lg font-semibold mb-3">Yearly Performance</h2>

                        {!barReady ? (
                            <SkeletonGraph />   // show loader
                        ) : (
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF1A" />
                                    <XAxis dataKey="name" stroke="#FFFFFF99" tick={{ fill: "#FFFFFF99" }} />
                                    <YAxis stroke="#FFFFFF99" tick={{ fill: "#FFFFFF99" }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#0F0F0F",
                                            border: "1px solid #FFFFFF1A",
                                            borderRadius: "8px",
                                            color: "#FFFFFF",
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#5B9CFF" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* PIE CHART */}
                <div
                    ref={pieRef}
                    className="rounded-2xl border border-[#FFFFFF1A] bg-[#FFFFFF0D] p-5
                        h-[300px] sm:h-[360px] md:h-[420px] xl:h-[480px] item-center ">

                    <h2 className="text-white text-lg font-semibold mb-3">Monthly Performance</h2>
                    {!pieReady ? (
                        <SkeletonPie />   // show loader
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart >
                                <Tooltip
                                    contentStyle={{
                                        background: "#0F0F0F",
                                        border: "1px solid #FFFFFF1A",
                                        borderRadius: "8px",
                                    }}
                                    itemStyle={{
                                        color: "#FFFFFF",   // ← Tooltip text color
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                />

                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    labelLine={true}                // enables connector lines
                                    label={renderOuterName}         // name OUTSIDE
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>

                                {/* INNER VALUE LABELS (added as separate Pie) */}
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    label={renderInnerValue}        // value INSIDE
                                    isAnimationActive={false}
                                    stroke="none"
                                    fill="transparent"
                                    pointerEvents="none"
                                    tooltipType="none"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

            </div >
        </DashboardLayout >
    );

}