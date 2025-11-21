<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\RfidTag;

class RfidTagController extends Controller
{
    public function index()
    {
        $tags = RfidTag::with('santri')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $tags]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'uid' => 'required|string|unique:rfid_tags,uid',
            'santri_id' => 'nullable|exists:santri,id',
            'label' => 'string|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $tag = RfidTag::create($request->only(['uid', 'santri_id', 'label']));
        return response()->json(['success' => true, 'data' => $tag], 201);
    }

    public function update(Request $request, $id)
    {
        $tag = RfidTag::find($id);
        if (!$tag) return response()->json(['success' => false, 'message' => 'Tag not found'], 404);

        $validator = Validator::make($request->all(), [
            'santri_id' => 'nullable|exists:santri,id',
            'label' => 'string|nullable',
            'active' => 'boolean|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $tag->update($request->only(['santri_id', 'label', 'active']));

        return response()->json(['success' => true, 'data' => $tag]);
    }

    public function destroy($id)
    {
        $tag = RfidTag::find($id);
        if (!$tag) return response()->json(['success' => false, 'message' => 'Tag not found'], 404);

        $tag->delete();
        return response()->json(['success' => true, 'message' => 'Tag removed']);
    }
}
