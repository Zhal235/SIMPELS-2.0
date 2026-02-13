<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Jabatan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jabatan';

    protected $fillable = [
        'nama',
        'kode',
        'level',
        'department_id',
        'parent_id',
        'deskripsi',
    ];

    protected $dates = ['created_at', 'updated_at', 'deleted_at'];

    protected $casts = [
        'level' => 'integer',
        'department_id' => 'integer',
        'parent_id' => 'integer',
    ];

    // Relasi dengan department
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    // Relasi hierarki parent
    public function parent()
    {
        return $this->belongsTo(Jabatan::class, 'parent_id');
    }

    // Relasi hierarki children
    public function children()
    {
        return $this->hasMany(Jabatan::class, 'parent_id');
    }

    // Recursive method untuk get all children
    public function allChildren()
    {
        return $this->children()->with('allChildren');
    }

    // Scope untuk root level jabatan (yang tidak punya parent)
    public function scopeRootLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    // Scope untuk filter by department
    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    // Get jabatan dengan level tertentu
    public function scopeByLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    // Check apakah jabatan ini adalah parent dari jabatan lain
    public function isParentOf($jabatanId)
    {
        return $this->children()->where('id', $jabatanId)->exists();
    }

    // Get path hierarki dari root ke jabatan ini
    public function getHierarchyPath()
    {
        $path = collect([$this->nama]);
        $current = $this;
        
        while ($current->parent) {
            $current = $current->parent;
            $path->prepend($current->nama);
        }
        
        return $path->implode(' > ');
    }
}