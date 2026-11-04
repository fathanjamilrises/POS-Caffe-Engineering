<?php

namespace App\Http\Controllers;

use App\Models\KitchenTicket;
use App\Services\KitchenKdsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KitchenKdsController extends Controller
{
    public function __construct(
        protected KitchenKdsService $kdsService,
    ) {}

    /**
     * Display Kitchen Display System (KDS).
     */
    public function index(Request $request): Response
    {
        $tickets = $this->kdsService->getActiveTickets();
        $unnotifiedCount = $this->kdsService->getUnnotifiedCount();

        return Inertia::render('Kitchen/Display', [
            'tickets' => $tickets,
            'unnotified_count' => $unnotifiedCount,
        ]);
    }

    /**
     * Progress kitchen ticket to cooking or delivered_to_cashier.
     */
    public function updateStatus(Request $request, KitchenTicket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:waiting,cooking,delivered_to_cashier,completed'],
        ]);

        $this->kdsService->updateTicketStatus(
            $ticket->id,
            $validated['status'],
            $request->user()->id
        );

        return redirect()->back()->with('success', "Status tiket #{$ticket->token_number} diperbarui.");
    }

    /**
     * Acknowledge audio alert when chef clicks or views new tickets.
     */
    public function acknowledgeAudio(Request $request): RedirectResponse
    {
        $this->kdsService->markAudioNotified();

        return redirect()->back();
    }
}
