<?php

namespace App\Http\Requests\Santri;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSantriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nis' => ['required', 'string', 'max:255', 'unique:santri,nis'],
            'nama_santri' => ['required', 'string', 'max:255'],
            'tempat_lahir' => ['required', 'string', 'max:255'],
            'tanggal_lahir' => ['required', 'date'],
            'jenis_kelamin' => ['required', Rule::in(['L', 'P'])],
            'alamat' => ['required', 'string'],
            'nama_ayah' => ['required', 'string', 'max:255'],
            'nama_ibu' => ['required', 'string', 'max:255'],
            'nisn' => ['nullable', 'string', 'max:255'],
            'nik_santri' => ['nullable', 'string', 'max:255'],
            'kelas_id' => ['nullable'],
            'kelas_nama' => ['nullable', 'string', 'max:255'],
            'asrama_id' => ['nullable'],
            'asrama_nama' => ['nullable', 'string', 'max:255'],
            'asal_sekolah' => ['nullable', 'string', 'max:255'],
            'hobi' => ['nullable', 'string', 'max:255'],
            'cita_cita' => ['nullable', 'string', 'max:255'],
            'jumlah_saudara' => ['nullable', 'integer'],
            'provinsi' => ['nullable', 'string', 'max:255'],
            'kabupaten' => ['nullable', 'string', 'max:255'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'desa' => ['nullable', 'string', 'max:255'],
            'kode_pos' => ['nullable', 'string', 'max:20'],
            'no_kk' => ['nullable', 'string', 'max:255'],
            'nik_ayah' => ['nullable', 'string', 'max:255'],
            'pendidikan_ayah' => ['nullable', 'string', 'max:255'],
            'pekerjaan_ayah' => ['nullable', 'string', 'max:255'],
            'hp_ayah' => ['nullable', 'string', 'max:255'],
            'nik_ibu' => ['nullable', 'string', 'max:255'],
            'pendidikan_ibu' => ['nullable', 'string', 'max:255'],
            'pekerjaan_ibu' => ['nullable', 'string', 'max:255'],
            'hp_ibu' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'file', 'image', 'max:2048'],
            'status' => ['nullable', Rule::in(['aktif', 'keluar', 'mutasi', 'alumni', 'lulus'])],
            'jenis_penerimaan' => ['nullable', Rule::in(['baru', 'mutasi_masuk'])],
            'tanggal_keluar' => ['nullable', 'date'],
            'tujuan_mutasi' => ['nullable', 'string', 'max:255'],
            'alasan_mutasi' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'nis.required' => 'NIS wajib diisi.',
            'nis.unique' => 'NIS sudah terdaftar.',
            'nama_santri.required' => 'Nama santri wajib diisi.',
            'tempat_lahir.required' => 'Tempat lahir wajib diisi.',
            'tanggal_lahir.required' => 'Tanggal lahir wajib diisi.',
            'tanggal_lahir.date' => 'Format tanggal lahir tidak valid.',
            'jenis_kelamin.required' => 'Jenis kelamin wajib diisi.',
            'jenis_kelamin.in' => 'Jenis kelamin harus L atau P.',
            'alamat.required' => 'Alamat wajib diisi.',
            'nama_ayah.required' => 'Nama ayah wajib diisi.',
            'nama_ibu.required' => 'Nama ibu wajib diisi.',
            'foto.image' => 'File foto harus berupa gambar.',
            'foto.max' => 'Ukuran foto maksimal 2MB.',
        ];
    }

    public function getSanitizedData(): array
    {
        $data = $this->validated();
        unset($data['kelas_nama'], $data['asrama_nama']);
        return $data;
    }
}
