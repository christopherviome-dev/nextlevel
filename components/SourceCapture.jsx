"use client";
import { useEffect } from "react";
import { captureSource } from "../lib/source";
// Remembers where a visitor first came from (lib/source.js). Renders nothing.
export default function SourceCapture() { useEffect(() => { captureSource(); }, []); return null; }
