import { X } from 'lucide-react' 
import { FormField, inputClass } from '../globalComponents'
import { useState } from 'react'


interface UpdateModalProps {
    open: boolean
    onClose: () => void
    documentUrl?: any
    onSuccess?: (file: File) => void
}

export default function UploadModal({
    open,
    documentUrl,
    onClose,
    onSuccess,
}: UpdateModalProps) {

    const [file, setFile] = useState<File>()
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                <div>
                    <h2 className="text-sm font-semibold text-[#17233b]">
                    Documento Anexado
                    </h2>

                    <p className="mt-0.5 text-[9px] text-slate-400">
                        Ingresa documento para completar licitacion.   
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="
                    flex h-7 w-7
                    items-center justify-center
                    rounded-md
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-600
                    "
                >
                    <X size={15} />
                </button>

                </div>
                {/* form */}
                <div className=" p-5">
                    {documentUrl != null && (
                        <>
                        <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                            Ya hay un documento anexado
                        </span>
                        <div className="my-1.5 px-2 inputClass border rounded-md border-slate-200 whitespace-nowrap overflow-hidden">
                            <a href={documentUrl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className='text-ellipsis text-[9px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 hover:underline'
                            >{documentUrl.url}</a>
                        </div>
                        
                        </>
                    )}
                    <FormField label="Archivo a subir">
                        <input
                        type="file"
                        className={inputClass}
                        accept=".pdf"
                        onChange={(event) => {
                            const selectedFile = event.target.files?.[0];
                            if (selectedFile) {
                                setFile(selectedFile)
                                setUploadError(null)
                                }
                        }}
                        />
                        {/* Selected file */}
                        {file && (
                        <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                            <p className="truncate text-[10px] text-slate-600">
                            {file.name}
                            </p>

                            <button
                            type="button"
                            onClick={() => {
                                setUploading(true)
                                onSuccess?.(file)}
                            }
                            disabled={uploading}
                            className="
                                ml-3
                                rounded-md
                                bg-[#0bc99b]
                                px-3 py-1.5
                                text-[9px]
                                font-semibold
                                text-[#071b2f]
                                transition
                                hover:bg-[#0ab58c]
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                            >
                            {uploading ? 'Subiendo...' : 'Confirmar'}
                            </button>
                        </div>
                        )}
                    </FormField>
                </div>
                {/* Error */}
                {uploadError && (
                <p className="text-[9px] text-red-500">
                    {uploadError}
                </p>
                )}
            </div>
            
        </div>
    )
}