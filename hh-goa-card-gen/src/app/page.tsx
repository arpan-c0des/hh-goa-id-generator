'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';

export default function Home() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.heic')) {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg' });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      setImageSrc(URL.createObjectURL(blob));
    } else {
      setImageSrc(URL.createObjectURL(file));
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match image native resolution
    canvas.width = 1200;
    canvas.height = 840;

    // 1. Draw Background Template Image
    const bgImg = new window.Image();
    bgImg.src = '/card-bg.png';
    bgImg.onload = () => {
      ctx.drawImage(bgImg, 0, 0, 1200, 840);

      // 2. Draw Top-Left Card Logo
      const logoImg = new window.Image();
      logoImg.src = '/card-logo.png';
      logoImg.onload = () => {
        ctx.drawImage(logoImg, 70, 60, 320, 90);
        drawUserPhotoAndText(ctx);
      };
      logoImg.onerror = () => {
        drawUserPhotoAndText(ctx);
      };
    };
  };

  const drawUserPhotoAndText = (ctx: CanvasRenderingContext2D) => {
    // Laptop screen coordinates
    const screenX = 233;
    const screenY = 466;
    const screenW = 275;
    const screenH = 190;

    if (imageSrc) {
      const userImg = new window.Image();
      userImg.src = imageSrc;
      userImg.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(screenX, screenY, screenW, screenH);
        ctx.clip();

        const aspect = userImg.width / userImg.height;
        let dw = screenW;
        let dh = screenH;
        let dx = screenX;
        let dy = screenY;

        if (aspect > screenW / screenH) {
          dh = screenH;
          dw = screenH * aspect;
          dx = screenX - (dw - screenW) / 2;
        } else {
          dw = screenW;
          dh = screenW / aspect;
          dy = screenY - (dh - screenH) / 2;
        }

        ctx.drawImage(userImg, dx, dy, dw, dh);
        ctx.restore();

        renderDynamicText(ctx);
      };
    } else {
      renderDynamicText(ctx);
    }
  };

  const renderDynamicText = (ctx: CanvasRenderingContext2D) => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        drawTextContent(ctx);
      });
    } else {
      drawTextContent(ctx);
    }
  };

  const drawTextContent = async (ctx: CanvasRenderingContext2D) => {
   // 1. Centered Name Section between Crosshair Target Icons
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 60px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const crosshairMidX = 165; // Horizontal midpoint between target icons
    const nameY = 300;         // Vertical position in the name zone

    const fullName = (name || 'ARPAN MAHANTY').toUpperCase();
    const nameParts = fullName.split(' ');

    // Split long names into 2 centered stacked lines if needed
    if (nameParts.length > 1) {
      ctx.fillText(nameParts[0], crosshairMidX, nameY - 25);
      ctx.fillText(nameParts.slice(1).join(' '), crosshairMidX, nameY + 25);
    } else {
      ctx.fillText(fullName, crosshairMidX, nameY);
    }
    ctx.restore();

    // 2. Role / Stack centered between the Crosshair Targets (Above Laptop)
    ctx.save();
    ctx.fillStyle = '#fee140'; // High-contrast Yellow
    ctx.font = '900 25px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Positioned horizontally centered between crosshairs (X = 340) at Y = 405
    const crosshairMidXRole = 340;
    const crosshairY = 405;

    ctx.fillText((role || 'UI/UX DESIGNER').toUpperCase(), crosshairMidXRole, crosshairY);
    ctx.restore();

   // 3. Social Handles (Bottom-Right Corner)
    ctx.save();
    ctx.fillStyle = '#fee140';
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    const bottomRightX = 1160; // Near the right edge
    const bottomRightY = 810;  // Near the bottom edge

    ctx.fillText(`LI: ${linkedin}`, bottomRightX, bottomRightY);
    ctx.fillText(`GH: @${github}`, bottomRightX, bottomRightY - 26);
    ctx.restore();
  // ==========================================
  // 4. Dynamic QR Code & #frameingoa Subtext
  // ==========================================
  // --- ADJUSTABLE POSITIONS & DIMENSIONS ---
  const qrX = 1020;         // X coordinate (Left Area)
  const qrY = 100;        // Y coordinate (Above "BUILD IDEAS")
  const qrSize = 130;     // Width & Height of QR Code
  const textYOffset = 18; // Gap between QR Code and Hashtag
  const fontSize = 20;    // Hashtag Font Size
  // -----------------------------------------

  // Unique QR Data Payload per user
  const qrData = github
    ? `https://github.com/${github}`
    : `https://hackerhouse.goa/pass/${(name || 'builder').toLowerCase().replace(/\s+/g, '-')}`;

  try {
    // Generate QR Code Data URL
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const qrImg = new window.Image();
    qrImg.src = qrDataUrl;

    qrImg.onload = () => {
      // Draw QR Code
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Draw "#frameingoa" Subtext centered directly under the QR code
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const hashtagX = qrX + qrSize / 2;
      const hashtagY = qrY + qrSize + textYOffset;

      ctx.fillText('#frameingoa', hashtagX, hashtagY);
      ctx.restore();
    };
  } catch (err) {
    console.error('QR Code generation failed', err);
  }
};
  useEffect(() => {
    drawCanvas();
  }, [name, role, github, linkedin, imageSrc]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${(name || 'Builder').replace(/\s+/g, '_')}_HH_Goa_Pass.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShareToX = () => {
    const tweetText = encodeURIComponent(
      `Excited to build at HH Goa 2026! Here is my official Builder Pass. 🚀\n\n#FrameInGoa`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

 return (
    <div className="relative min-h-screen text-white font-mono flex flex-col items-center overflow-x-hidden">
      
      {/* BACKGROUND LAYER 1: Blurred Artwork */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center filter blur-lg opacity-35 scale-105 pointer-events-none"
        style={{
          backgroundImage: 'url("/site-bg.png")',
        }}
      />

      {/* BACKGROUND LAYER 2: Dotted Cream Layer (Sits over the artwork, under the content) */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          backgroundColor: '#FFFFFF00',
          opacity: 0.50,
          backgroundImage: 'radial-gradient(#a39f8c 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* FOREGROUND CONTENT LAYER (z-20 ensures all cards, headers, and inputs sit on top) */}
      <div className="relative z-20 w-full flex flex-col items-center">
      {/* Top Header */}
      <header className="w-full bg-[#154C28] px-8 py-4 flex justify-between items-center border-b border-[#132c1e]">
        <div className="flex items-center gap-6">
          <div className="border-r border-[#1e3a29] pr-6">
            <Image
              src="/hacker-house-logo.png"
              alt="Hacker House Goa Logo"
              width={200}
              height={64}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-bold text-[#facc15] tracking-wide">
              BUILDER ID CARD GENERATOR • GOA 2026
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">SINGLE THEME • BUILDER ID CARD</p>
          </div>
        </div>
        <div>
          <Image
            src="/studio-logo.png"
            alt="2:47 PM Studio Logo"
            width={200}
            height={80}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>
      </header>

      {/* Marquee Ticker */}
      <div className="w-full bg-[#fee140] text-black font-extrabold text-xs py-2.5 overflow-hidden border-b border-black">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
          <div className="flex items-center gap-8">
            <span>#FRAMEINGOA</span><span>•</span>
            <span>GOA 28-31 OCT 2026</span><span>•</span>
            <span>BUILD IN SUN</span><span>•</span>
            <span>SHIP FROM PARADISE</span><span>•</span>
            <span>#FRAMEINGOA</span><span>•</span>
            <span>GOA 28-31 OCT 2026</span><span>•</span>
            <span>BUILD IN SUN</span><span>•</span>
            <span>SHIP FROM PARADISE</span><span>•</span>
          </div>
          <div className="flex items-center gap-8">
            <span>#FRAMEINGOA</span><span>•</span>
            <span>GOA 28-31 OCT 2026</span><span>•</span>
            <span>BUILD IN SUN</span><span>•</span>
            <span>SHIP FROM PARADISE</span><span>•</span>
            <span>#FRAMEINGOA</span><span>•</span>
            <span>GOA 28-31 OCT 2026</span><span>•</span>
            <span>BUILD IN SUN</span><span>•</span>
            <span>SHIP FROM PARADISE</span><span>•</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <main className="w-full max-w-[1440px] p-6 lg:p-10 flex flex-col items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Form Box */}
          <section className="lg:col-span-5 w-full bg-[#091a10] border border-[#142e1e] p-2.5 rounded-2xl shadow-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-[#facc15] font-bold">01 / BUILDER PHOTO *</span>
                <span className="text-[9px] bg-[#122619] text-zinc-400 px-3 py-2 rounded border border-[#1b3825]">
                  EMPTY
                </span>
              </div>
              <label className="border-20 border-dashed border-[#1d3d28] hover:border-[#facc15] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-[#0d2115]">
                <div className="bg-[#173321] p-20 rounded-lg mb-1 text-[#facc15]">⬆</div>
                <span className="text-xs font-bold text-white text-center">Drop photo or click to upload</span>
                <span className="text-[9px] text-zinc-500 mt-1">JPG/PNG/HEIC • RAW auto</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/heic"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] text-[#facc15] font-bold block">02 / YOUR DETAILS</span>

              <div>
                <label className="text-[9px] text-zinc-400 block mb-1">FULL NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. Arpan Mahanty"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f4f1e8] text-black placeholder-zinc-500 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#facc15]"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 block mb-1">ROLE *</label>
                <input
                  type="text"
                  placeholder="e.g. UI/UX Designer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#0d2115] border border-[#1d3d28] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 block mb-1">GITHUB</label>
                <input
                  type="text"
                  placeholder="e.g. arpan_c0des"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="w-full bg-[#0d2115] border border-[#1d3d28] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 block mb-1">CONTACT / LINKEDIN</label>
                <input
                  type="text"
                  placeholder="e.g. mahantyarpan21@gm..."
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full bg-[#0d2115] border border-[#1d3d28] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </div>
          </section>

          {/* Right Live Preview Box */}
          <section className="lg:col-span-7 w-full bg-[#FFFFFF00] border border-[#FFFFFF00] p-4 rounded-2xl shadow-xl flex flex-col items-center justify-between space-y-2">
            <div className="bg-[#0b2114] text-[#fee140] text-xs font-bold px-5 py-1.5 rounded-full border border-[#183d26] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse"></span>
              LIVE PREVIEW • ID: HH026-55808 • GOA 2026
            </div>

            <div className="w-full flex justify-center">
              <canvas
                ref={canvasRef}
                className="w-full max-w-[950px] rounded-2xl shadow-2xl border-4 border-[#091a10]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={handleDownload}
                className="bg-[#064e3b] hover:bg-[#043e2f] text-white font-bold py-3 px-8 rounded-full text-xs flex items-center gap-2 transition border border-[#047857]"
              >
                📥 Download ID
              </button>
              <button
                onClick={handleShareToX}
                className="bg-white hover:bg-zinc-100 text-black font-bold py-3 px-8 rounded-full text-xs flex items-center gap-2 transition border border-zinc-300"
              >
                𝕏 Share to X
              </button>
              <button
                onClick={() => {
                  setName('');
                  setRole('Full-Stack Builder');
                  setImageSrc(null);
                }}
                className="bg-white hover:bg-zinc-100 text-black font-bold py-3 px-8 rounded-full text-xs flex items-center gap-2 transition border border-zinc-300"
              >
                🔄 Generate Another Pass
              </button>
            </div>
          </section>
        </div>
      </main>
      {/* Full-Width Unconstrained Footer */}
        <footer className="w-full mt-16 bg-[#16382c] border-t border-[#1e4839] text-[#e2e8f0] py-6 px-12 flex flex-row items-center justify-between font-mono text-xs z-30">
          <div className="flex flex-col gap-1 min-w-max">
            <div className="font-bold tracking-wide whitespace-nowrap">
              HACKER HOUSE GOA <span className="text-[#facc15]">• 2026 EDITION</span>
            </div>
            <div className="text-[11px] text-zinc-400 whitespace-nowrap">
              BUILD IN SUN • SHIP FROM PARADISE 🌺
            </div>
          </div>

          <div className="flex-shrink-0">
            <span className="bg-[#154C28] text-[#facc15] border border-[#275947] px-6 py-2.5 rounded-full font-bold text-[11px] tracking-wider whitespace-nowrap inline-block">
              #FRAMEINGOA • OCT 28–31
            </span>
          </div>

          <div className="text-zinc-400 text-[11px] tracking-tight whitespace-nowrap min-w-max text-right">
            © 2026 HACKER HOUSE GOA. ALL RIGHTS RESERVED.
          </div>
        </footer>
      </div>
    </div>
  );
}