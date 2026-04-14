<?php

namespace App\Http\Controllers\Api\V1\Wali;

use App\Http\Controllers\Api\BaseController;
use App\Http\Requests\Wali\ChangePasswordRequest;
use App\Http\Requests\Wali\LoginRequest;
use App\Http\Requests\Wali\SetDailyLimitRequest;
use App\Http\Requests\Wali\UploadBuktiRequest;
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

    public function login(LoginRequest $request)
    {
        try {
            $credentials = [
                'no_hp' => $request->no_hp,
                'password' => $request->password,
            ];

            $result = $this->authService->login($credentials, $request->header('User-Agent'));
            return response()->json($result);
        } catch (ValidationException $e) {
            throw $e;
        }
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $data = [
            'no_hp' => $request->no_hp,
            'current_password' => $request->current_password,
            'new_password' => $request->new_password,
        ];

        $result = $this->authService->changePassword($data);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getSantri(Request $request)
    {
        $result = $this->santriService->getSantriList();
        return response()->json($result);
    }

    public function getSantriDetail($santri_id)
    {
        $result = $this->santriService->getSantriDetail($santri_id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function submitDataCorrection(Request $request, $santri_id)
    {
        $request->validate([
            'field_name' => 'required|string',
            'old_value' => 'required|string',
            'new_value' => 'required|string',
            'note' => 'nullable|string',
        ]);

        $data = [
            'field_name' => $request->field_name,
            'old_value' => $request->old_value,
            'new_value' => $request->new_value,
            'note' => $request->note,
        ];

        $result = $this->santriService->submitDataCorrection($santri_id, $data);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getWallet(Request $request, $santriId)
    {
        $result = $this->walletService->getWallet($santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getSantriWalletHistory(Request $request, $santriId)
    {
        $result = $this->walletService->getSantriWalletHistory($santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function setSantriDailyLimit(SetDailyLimitRequest $request, $santriId)
    {
        $result = $this->walletService->setSantriDailyLimit($santriId, $request->daily_limit);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getAllTagihan(Request $request, $santriId)
    {
        $result = $this->paymentService->getAllTagihan($santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getPembayaran(Request $request, $santriId)
    {
        $result = $this->paymentService->getPembayaran($santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getTunggakan(Request $request, $santriId)
    {
        $result = $this->paymentService->getTunggakan($santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function uploadBukti(UploadBuktiRequest $request, $santriId)
    {
        try {
            $data = [
                'tagihan_ids' => $request->tagihan_ids ?? [],
                'total_nominal' => $request->total_nominal,
                'nominal_topup' => $request->nominal_topup ?? 0,
                'nominal_tabungan' => $request->nominal_tabungan ?? 0,
                'selected_bank_id' => $request->selected_bank_id,
                'bukti' => $request->file('bukti'),
                'catatan' => $request->catatan,
            ];

            $result = $this->paymentService->uploadBukti($santriId, $data);
            return response()->json($result, $result['status_code'] ?? 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getBuktiHistory($santriId)
    {
        try {
            $result = $this->paymentService->getBuktiHistory($santriId);
            return response()->json($result, $result['status_code'] ?? 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function uploadBuktiTopup(Request $request, $santriId)
    {
        $request->validate([
            'nominal' => 'required|numeric|min:1',
            'selected_bank_id' => 'nullable|integer|exists:bank_accounts,id',
            'bukti' => 'required|file|mimes:jpeg,jpg,png|max:5120',
            'catatan' => 'nullable|string|max:500',
        ]);

        try {
            $data = [
                'nominal' => $request->nominal,
                'selected_bank_id' => $request->selected_bank_id,
                'bukti' => $request->file('bukti'),
                'catatan' => $request->catatan,
            ];

            $result = $this->paymentService->uploadBuktiTopup($santriId, $data);
            return response()->json($result, $result['status_code'] ?? 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getBankAccounts()
    {
        try {
            $result = $this->paymentService->getBankAccounts();
            return response()->json($result, $result['status_code'] ?? 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}