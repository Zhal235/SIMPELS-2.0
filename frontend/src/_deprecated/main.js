import './style.css';
const app = document.querySelector('#app');
app.innerHTML = `
  <main class="min-h-screen flex items-center justify-center p-6">
    <section class="w-full max-w-xl card">
      <div class="mb-4">
        <h1 class="text-2xl font-semibold">Frontend terpisah</h1>
        <p class="text-sm text-gray-600">Proyek ini berjalan mandiri menggunakan Vite + TailwindCSS.</p>
      </div>
      <div class="flex gap-2">
        <a href="/" class="btn">Contoh tombol</a>
        <button class="btn" type="button">Aksi</button>
      </div>
    </section>
  </main>
`;
