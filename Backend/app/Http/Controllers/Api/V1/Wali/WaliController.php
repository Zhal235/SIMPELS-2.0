<?php

namespace App\Http\Controllers\Api\V1\Wali;

use App\Http\Controllers\Api\BaseController;
use App\Services\Wali\WaliAuthService;
use App\Services\Wali\WaliSantriService;
use App\Services\Wali\WaliWalletService;
use App\Services\Wali\WaliPaymentService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WaliController extends BaseController
{
    protected $authService;
    protected $santriService;
    protected $walletService;
    protected $paymentService;

    public function __construct(
        WaliAuthService $authService,
        WaliSantriService $santriService,
        WaliWalletService $walletService,
        WaliPaymentService $paymentService
    ) {
        $this->authService = $authService;
        $this->santriService = $santriService;
        $this->walletService = $walletService;
        $this->paymentService = $paymentService;
    }

    public function login(Request $request)
    {
        $request->validate(['no_hp' => 'required|string', 'password' => 'required|string']);
        try {
            $result = $this->authService->login(['no_hp' => $request->no_hp, 'password' => $request->password], $request->header('User-Agent'));
            return response()->json($result);
        } catch (ValidationException $e) { throw $e; }
    }

    public function changePassword(Request $request)
    {
        $request->validate(['no_hp' => 'required|string', 'current_password' => 'required|string', 'new_password' => 'required|string|min:6|confirmed']);
        $result = $this->authService->changePassword(['no_hp' => $request->no_hp, 'current_password' => $request->current_password, 'new_password' => $request->new_password]);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getSantri(Request $request)
    {
        return response()->json($this->santriService->getSantriList());
    }

    public function getSantriDetail($santri_id)
    {
        $result = $this->santriService->getSantriDetail($santri_id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function submitDataCorrection(Request $request, $santri_id)
    {
        $request->validate(['field_name' => 'required|string', 'old_value' => 'required|string', 'new_value' => 'required|string', 'note' => 'nullable|string']);
        $result = $this->santriService->submitDataCorrection($santri_id, ['field_name' => $request->field_name, 'old_value' => $request->old_value, 'new_value' => $request->new_value, 'note' => $request->note]);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getWallet(Request $request, $santriId)
    {
        return response()->json($this->walletService->getWallet($santriId), 200);
    }

    public function getSantriWalletHistory(Request $request, $santriId)
    {
        return response()->json($this->walletService->getSantriWalletHistory($santriId), 200);
    }

    public function setSantriDailyLimit(Request $request, $santriId)
    {
        $request->validate(['daily_limit' => 'required|numeric|min:0']);
        return response()->json($this->walletService->setSantriDailyLimit($santriId, $request->daily_limit), 200);
    }

    public function getAllTagihan(Request $request, $santriId)
    {
        return response()->json($this->paymentService->getAllTagihan($santriId), 200);
    }

    public function getPembayaran(Request $request, $santriId)
    {
        return response()->json($this->paymentService->getPembayaran($santriId), 200);
    }

    public function getTunggakan(Request $request, $santriId)
    {
        return response()->json($this->paymentService->getTunggakan($santriId), 200);
    }

    public function uploadBukti(Request $request, $santriId)
    {
        $request->validate(['tagihan_ids' => 'nullable|array', 'tagihan_ids.*' => 'required|integer|exists:tagihan_santri,id', 'total_nominal' => 'required|numeric|min:1', 'nominal_topup' => 'nullable|numeric|min:0', 'nominal_tabungan' => 'nullable|numeric|min:0', 'selected_bank_id' => 'nullable|integer|exists:bank_accounts,id', 'bukti' => 'required|file|mimes:jpeg,jpg,png|max:5120', 'catatan' => 'nullable|string|max:500']);
        try {
            $data = ['tagihan_ids' => $request->tagihan_ids ?? [], 'total_nominal' => $request->total_nominal, 'nominal_topup' => $request->nominal_topup ?? 0, 'nominal_tabungan' => $request->nominal_tabungan ?? 0, 'selected_bank_id' => $request->selected_bank_id, 'bukti' => $request->file('bukti'), 'catatan' => $request->catatan];
            $result = $this->paymentService->uploadBukti($santriId, $data);
            return response()->json($result, $result['status_code'] ?? 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function getBuktiHistory($santriId)
    {
        try {
            return response()->json($this->paymentService->getBuktiHistory($santriId), 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function uploadBuktiTopup(Request $request, $santriId)
    {
        $request->validate(['nominal' => 'required|numeric|min:1', 'selected_bank_id' => 'nullable|integer|exists:bank_accounts,id', 'bukti' => 'required|file|mimes:jpeg,jpg,png|max:5120', 'catatan' => 'nullable|string|max:500']);
        try {
            $data = ['nominal' => $request->nominal, 'selected_bank_id' => $request->selected_bank_id, 'bukti' => $request->file('bukti'), 'catatan' => $request->catatan];
            return response()->json($this->paymentService->uploadBuktiTopup($santriId, $data), 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function getBankAccounts()
    {
        try {
            return response()->json($this->paymentService->getBankAccounts(), 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}