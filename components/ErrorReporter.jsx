"use client";
import { useEffect } from "react";
import { installErrorReporting } from "../lib/errorReport";
// Renders nothing: listens for errors and sends them to the admin's error log.
export default function ErrorReporter() { useEffect(() => { installErrorReporting(); }, []); return null; }
