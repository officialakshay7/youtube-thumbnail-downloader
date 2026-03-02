(function () {
    // ----- DOM Elements -----
    const urlInput = document.getElementById('urlInput');
    const getThumbBtn = document.getElementById('getThumbBtn');
    const resultArea = document.getElementById('resultArea');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        });
    });

    // ----- Helper Functions -----
    function extractVideoId(url) {
        if (!url) return null;

        // YouTube patterns
        let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
        if (match) return match[1];

        // Vimeo patterns
        match = url.match(/(?:vimeo\.com\/)(\d+)/);
        if (match) return match[1];

        return null;
    }

    function detectPlatform(url) {
        if (!url) return null;
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('vimeo.com')) return 'vimeo';
        return null;
    }

    function getThumbnailUrls(videoId, platform) {
        const qualities = [];
        if (platform === 'youtube') {
            qualities.push(
                { label: 'MaxRes (HD)', quality: 'maxresdefault.jpg', width: 1280, height: 720, size: 'HD' },
                { label: 'High Quality', quality: 'hqdefault.jpg', width: 480, height: 360, size: 'SD' },
                { label: 'Medium Quality', quality: 'mqdefault.jpg', width: 320, height: 180, size: 'SD' },
                { label: 'Standard', quality: 'sddefault.jpg', width: 640, height: 480, size: 'SD' }
            );
        } else if (platform === 'vimeo') {
            qualities.push(
                { label: 'Vimeo Thumbnail', quality: `${videoId}.jpg`, width: 640, height: 360, size: 'HD' }
            );
        }
        return qualities;
    }

    function buildImageUrl(videoId, platform, quality) {
        if (platform === 'youtube') {
            return `https://img.youtube.com/vi/${videoId}/${quality}`;
        } else {
            return `https://vumbnail.com/${videoId}.jpg`;
        }
    }

    // ----- Download Function (Auto-download when clicking a card) -----
    function downloadImage(url, filename) {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename || 'thumbnail.jpg';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            })
            .catch(() => {
                // Fallback if fetch fails (CORS issues)
                window.open(url, '_blank');
            });
    }

    // ----- Display Thumbnails with Auto-download on Card Click -----
    function displayThumbnails(videoId, platform) {
        resultArea.innerHTML = '';

        const qualities = getThumbnailUrls(videoId, platform);
        if (!qualities || qualities.length === 0) {
            resultArea.innerHTML = `<div class="bg-red-50 p-6 rounded-xl text-center text-red-700 border border-red-200" role="alert">No thumbnail qualities found.</div>`;
            return;
        }

        // Create header with instructions
        const header = document.createElement('div');
        header.className = 'mb-6 text-center';
        header.innerHTML = `
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Choose Your Thumbnail Size</h2>
                    <p class="text-gray-600">Click on any thumbnail card to download instantly</p>
                `;
        resultArea.appendChild(header);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5';
        gridContainer.setAttribute('aria-label', 'Thumbnail quality options');

        qualities.forEach((item) => {
            const imgUrl = buildImageUrl(videoId, platform, item.quality);
            const filename = `yt-thumb-${videoId}-${item.quality}`;

            const card = document.createElement('div');
            card.className = 'quality-card bg-white rounded-xl shadow-md border border-gray-200 p-4 flex flex-col transition-all';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Download ${item.label} thumbnail`);

            // Add click event for auto-download
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking the download button specifically
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
                    return;
                }
                downloadImage(imgUrl, filename);

                // Visual feedback
                card.classList.add('selected');
                setTimeout(() => card.classList.remove('selected'), 200);
            });

            // Add keyboard support
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    downloadImage(imgUrl, filename);
                    card.classList.add('selected');
                    setTimeout(() => card.classList.remove('selected'), 200);
                }
            });

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `${item.label} thumbnail for video ID ${videoId} - ${item.width}x${item.height} pixels`;
            img.loading = 'lazy';
            img.className = 'w-full h-auto rounded-lg mb-3 border border-gray-100 bg-gray-100';
            img.onerror = (e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22120%22%20height%3D%2290%22%20viewBox%3D%220%200%20120%2090%22%3E%3Crect%20width%3D%22120%22%20height%3D%2290%22%20fill%3D%22%23eeeeee%22%2F%3E%3Ctext%20x%3D%2210%22%20y%3D%2245%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23999%22%3EImage not available%3C%2Ftext%3E%3C%2Fsvg%3E';
            };

            const label = document.createElement('h3');
            label.className = 'font-semibold text-gray-800 text-lg';
            label.innerText = item.label;

            const resolution = document.createElement('p');
            resolution.className = 'text-sm text-gray-500 mb-3';
            resolution.innerText = `${item.width} x ${item.height} pixels`;

            const downloadBtn = document.createElement('a');
            downloadBtn.href = '#';
            downloadBtn.className = 'mt-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg text-center transition flex items-center justify-center gap-2';
            downloadBtn.innerHTML = `<i class="fas fa-download" aria-hidden="true"></i> Download ${item.size || ''}`;
            downloadBtn.setAttribute('aria-label', `Download ${item.label} thumbnail`);

            // Prevent card click from interfering and trigger download
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                downloadImage(imgUrl, filename);
            });

            card.appendChild(img);
            card.appendChild(label);
            card.appendChild(resolution);
            card.appendChild(downloadBtn);
            gridContainer.appendChild(card);
        });

        resultArea.appendChild(gridContainer);

        if (platform === 'vimeo') {
            const vimeoNote = document.createElement('p');
            vimeoNote.className = 'text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mt-6 border border-amber-200 flex items-center gap-2';
            vimeoNote.innerHTML = '<i class="fas fa-info-circle" aria-hidden="true"></i> Vimeo thumbnails are fetched via vumbnail.com. For the highest quality, consider using the official API.';
            vimeoNote.setAttribute('role', 'note');
            resultArea.appendChild(vimeoNote);
        }
    }

    // ----- Handle Get Thumbnails -----
    function handleExtract() {
        const url = urlInput.value.trim();
        if (!url) {
            resultArea.innerHTML = `<div class="bg-yellow-50 p-4 rounded-xl text-yellow-700 border border-yellow-200" role="alert">Please paste a YouTube or Vimeo URL.</div>`;
            return;
        }

        const platform = detectPlatform(url);
        if (!platform) {
            resultArea.innerHTML = `<div class="bg-red-50 p-4 rounded-xl text-red-700 border border-red-200" role="alert">Unsupported URL. Please use a YouTube or Vimeo link.</div>`;
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            resultArea.innerHTML = `<div class="bg-red-50 p-4 rounded-xl text-red-700 border border-red-200" role="alert">Could not extract video ID. Check the URL format.</div>`;
            return;
        }

        // Show loading skeleton
        resultArea.innerHTML = `
                    <div class="text-center mb-4">
                        <div class="skeleton w-48 h-8 mx-auto mb-4"></div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            ${Array(4).fill(0).map(() => `
                                <div class="bg-white rounded-xl shadow-sm border p-4">
                                    <div class="skeleton w-full h-32 mb-3"></div>
                                    <div class="skeleton w-3/4 h-5 mb-2"></div>
                                    <div class="skeleton w-1/2 h-4 mb-3"></div>
                                    <div class="skeleton w-full h-9 rounded-lg"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

        setTimeout(() => {
            displayThumbnails(videoId, platform);
        }, 300);
    }

    // ----- Set Example URLs -----
    window.setExampleUrl = function (type) {
        if (type === 'youtube') {
            urlInput.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        } else if (type === 'vimeo') {
            urlInput.value = 'https://vimeo.com/76979871';
        }
        handleExtract();
    };

    // ----- Event Listeners -----
    getThumbBtn.addEventListener('click', handleExtract);
    urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleExtract(); });

    // Auto-load example on page load
    window.addEventListener('load', () => {
        setTimeout(handleExtract, 100);
    });

    // ----- FAQ Toggle Function -----
    window.toggleFAQ = function (button) {
        const answer = button.nextElementSibling;
        const icon = button.querySelector('i');
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        answer.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
        button.setAttribute('aria-expanded', !isExpanded);
    };

    // ----- Active Nav Link on Scroll -----
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
})();