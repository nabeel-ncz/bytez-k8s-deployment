import React, { useState, useEffect } from 'react';
import { Breadcrumbs, Button } from "@material-tailwind/react";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CustomFileInput from '../../../components/CustomFileInput/CustomFileInput';
import { SwatchesPicker } from "react-color";
import CustomFileInputSmall from '../../../components/CustomFileInput/CustomFileInputSmall';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import productVarientSchema from '../../../schema/admin/productVarientSchema';
import { updateProductVarient, createNewAttribute, getAllAttribute } from '../../../store/actions/admin/adminActions';
import { useParams } from 'react-router-dom';
import ExistingFileInput from '../../../components/CustomFileInput/ExistingFileInput';
import { getBrandsInAdminApi, getCategoryInAdminApi, getProductVarientInAdminApi } from '../../../services/api';
import { BASE_URL } from '../../../constants/urls';

function EditVarient() {
    const [subImages, setSubImages] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
    const keysWithData = Object.keys(subImages).filter(key => subImages[key] !== null);
    const [mainImage, setMainImage] = useState(null);
    const [subImagesUpdated, setSubImagesUpdated] = useState(false);
    const [color, setColor] = useState(null);
    const [product, setProduct] = useState(null);
    const [search] = useSearchParams();
    const [newRam, setNewRam] = useState("");
    const [newRom, setNewRom] = useState("")
    const [attributeError, setAttributeError] = useState(null);
    const [categoryAndBrand, setCategoryAndBrand] = useState(null);

    const attributes = useSelector((state) => state?.admin?.productAttributes?.data);

    const pId = search.get("pId");
    const vId = search.get("vId");

    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        handleFetch();
        dispatch(getAllAttribute());
        handleCategoryAndBrand();
    }, []);

    const handleCategoryAndBrand = (category, brand) => {
        getCategoryInAdminApi(category).then((response) => {
            if (response.data?.status === "ok") {
                getBrandsInAdminApi(brand).then((result) => {
                    if (result?.data?.status === "ok") {
                        setCategoryAndBrand({
                            category: response?.data?.data?.category,
                            brand: result?.data?.data?.brand
                        });
                    }
                })
            } else {
                setCategoryAndBrand(null)
            }
        })
    }

    const handleFetch = () => {
        getProductVarientInAdminApi(pId, vId).then((response) => {
            if (response.data?.status === "ok") {
                setProduct(response.data?.data);
                handleCategoryAndBrand(response.data?.data?.category, response.data?.data?.brand)
            } else {
                setProduct(null);
            }
        })
    }

    const handleSubImageChange = (file, imageName) => {
        setSubImages((state) => ({
            ...state,
            [imageName]: file,
        }));
        setSubImagesUpdated(true);
    }
    const handleThumbnail = (file) => {
        setMainImage(file);
    }
    const handleColorPicker = (color, event) => {
        setProduct(state => ({
            ...state,
            color: null,
        }));
        setColor(color.hex)
    }

    const clearExistingThumbnail = () => {
        setProduct(state => ({
            ...state,
            images: {
                ...state.images,
                mainImage: null,
            }
        }))
    }

    const clearExistingSubImage = (file) => {
        const filtered = product?.images?.subImages.filter((url) => url !== file);
        console.log(filtered)
        setProduct(state => ({
            ...state,
            images: {
                ...state.images,
                subImages: filtered
            }
        }))
    }

    const handleAttributeSubmit = (event) => {
        event.preventDefault();
        if (newRam !== "" && newRom !== "" && newRam > 0 && newRom > 0) {
            dispatch(createNewAttribute({ ram: newRam, rom: newRom })).then(() => {
                dispatch(getAllAttribute());
                setNewRam("");
                setNewRom("");
                setAttributeError(null);
            })
        } else {
            setAttributeError("RAM and ROM should be greated that 0");
        }
    }

    const handleFormSubmit = (data) => {
        if ((!product?.images?.mainImage && !mainImage) || (product?.images?.subImages?.length + keysWithData.length < 2) || (!color && !product?.color)) {
            toast.error("Please correct the errors!");
        } else {
            const formData = new FormData();
            formData.append("productId", pId);
            formData.append("varientId", product?.varientId);
            formData.append("description", data.description);
            formData.append("stockQuantity", data.stockQuantity);
            formData.append("price", data.price);
            formData.append("discountPrice", data.discountPrice);
            formData.append("markup", data.markup);
            formData.append("status", data.status);
            formData.append("ramAndRom", data.ramAndRom);
            {
                product?.color ? formData.append("color", product?.color) : formData.append("color", color);
            }
            {
                !product?.images?.mainImage && formData.append("mainImageUpdated", true);
            }
            formData.append("subImagesUpdated", subImagesUpdated);
            formData.append("mainImage", mainImage);
            formData.append("currThumbnail", product?.images?.mainImage);
            formData.append("currSubImages", JSON.stringify(product?.images?.subImages));

            let index = 1;
            Object.keys(subImages).forEach((key) => {
                const value = subImages[key];
                if (value !== null) {
                    formData.append(`subImage${index++}`, value);
                }
            })
            console.log(formData)
            dispatch(updateProductVarient(formData)).then(() => {
                toast.success("Product varient is Updated");
                navigate(`/admin/products/view/${pId}`);
            }).catch(() => {
                toast.error("There is something went wrong, Please try again later");
            })
        }
    }
    return (
        <>
            {console.log(product?.images?.subImages)}
            <div className="px-5 pt-2 w-full md:overflow-y-hidden">

                <Formik
                    initialValues={{
                        description: product?.description, stockQuantity: product?.stockQuantity, price: product?.price, discountPrice: product?.discountPrice,
                        markup: product?.markup, status: product?.status, ramAndRom: product?.ramAndRom
                    }}
                    validationSchema={productVarientSchema}
                    onSubmit={handleFormSubmit}
                    enableReinitialize
                >
                    <Form className="">
                        <div className="flex justify-between items-center text-xs font-semibold">
                            <div>
                                <h1 className="font-bold text-2xl text-start">Edit Varient</h1>
                                <Breadcrumbs>
                                    <Link to={"/admin"} className="opacity-60">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                        </svg>
                                    </Link>
                                    <Link to={"/admin/products"}>
                                        Products
                                    </Link>
                                    <Link to={"/admin/products/create"}>
                                        Add Product
                                    </Link>
                                </Breadcrumbs>
                            </div>
                            <div className="flex w-full justify-end gap-2 mb-2">
                                <Button variant='outlined' onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button type='submit' variant='gradient'>
                                    Save
                                </Button>
                            </div>
                        </div>
                        <div className='lg:flex'>
                            {/* Product Information */}
                            <div className="lg:w-4/6 lg:mr-5">
                                <div className="bg-white p-5 rounded-lg mb-5 lg:flex gap-5">
                                    <div className="lg:w-1/3 mb-3 lg:mb-0 text-start">
                                        <h1 className="font-bold mb-3">Product Thumbnail</h1>
                                        {product?.images?.mainImage ?
                                            (<div className="mt-4 flex flex-col items-center">
                                                <div className="bg-white p-2 h-52 rounded shadow-sm mb-2 ">
                                                    <img
                                                        src={`${BASE_URL}/products/resized/${product?.images?.mainImage}`}
                                                        alt={"loading..."}
                                                        className="object-contain w-full h-full rounded"
                                                    />
                                                </div>
                                                <button onClick={clearExistingThumbnail}
                                                    className="mt-4 bg-blue-gray-800 text-white text-base font-medium py-1 px-3 rounded"
                                                >
                                                    Clear File
                                                </button>
                                            </div>)
                                            : (<>
                                                <CustomFileInput onChange={handleThumbnail} />
                                                {!mainImage && <h6 className="text-red-500 text-xs">Thumbnail is required</h6>}
                                            </>)}
                                    </div>
                                    <div className="lg:w-2/3 text-start">
                                        <h1 className="font-bold">Product Information</h1>
                                        <p className="text-sm mt-2 font-semibold">Title</p>

                                        <input
                                            type="text" name="title" value={product?.title} disabled
                                            className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200"
                                        />

                                        <p className="text-sm mt-2 font-semibold">Description</p>
                                        <Field
                                            as="textarea" type="text" name="description"
                                            className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200 h-36"
                                        />
                                        <ErrorMessage name="description" component="div" className="text-red-500 text-xs text-start" />

                                        <p className="text-sm mt-2 font-semibold">Stock</p>
                                        <Field
                                            name="stockQuantity" type="number"
                                            className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200"
                                        />
                                        <ErrorMessage name="stockQuantity" component="div" className="text-red-500 text-xs text-start" />

                                    </div>
                                </div>
                                {/* Image Uploading */}
                                <div className="bg-white p-5 rounded-lg mb-5 flex flex-col items-start justify-center">
                                    <h1 className="font-bold">Product Images</h1>
                                    <div className='mt-4 flex items-center justify-center gap-4'>
                                        {
                                            product?.images?.subImages[0] ?
                                                (<ExistingFileInput clearExistingFile={clearExistingSubImage} imageUrl={product?.images?.subImages[0]} />) : (<CustomFileInputSmall handleChange={handleSubImageChange} imageName={1} />)
                                        }
                                        {
                                            product?.images?.subImages[1] ?
                                                (<ExistingFileInput clearExistingFile={clearExistingSubImage} imageUrl={product?.images?.subImages[1]} />) : (<CustomFileInputSmall handleChange={handleSubImageChange} imageName={2} />)
                                        }
                                        {
                                            product?.images?.subImages[2] ?
                                                (<ExistingFileInput clearExistingFile={clearExistingSubImage} imageUrl={product?.images?.subImages[2]} />) : (<CustomFileInputSmall handleChange={handleSubImageChange} imageName={3} />)
                                        }
                                    </div>
                                    <div className='mt-4 flex items-center justify-center gap-4'>
                                        {
                                            product?.images?.subImages[3] ?
                                                (<ExistingFileInput clearExistingFile={clearExistingSubImage} imageUrl={product?.images?.subImages[3]} />) : (<CustomFileInputSmall handleChange={handleSubImageChange} imageName={4} />)
                                        }
                                        {
                                            product?.images?.subImages[4] ?
                                                (<ExistingFileInput clearExistingFile={clearExistingSubImage} imageUrl={product?.images?.subImages[4]} />) : (<CustomFileInputSmall handleChange={handleSubImageChange} imageName={5} />)
                                        }
                                        {
                                            product?.images?.subImages[5] ?
                                                (<ExistingFileInput clearExistingFile={clearExistingSubImage} imageUrl={product?.images?.subImages[5]} />) : (<CustomFileInputSmall handleChange={handleSubImageChange} imageName={6} />)
                                        }
                                    </div>
                                    {(product?.images?.subImages?.length + keysWithData.length < 2) &&
                                        <h6 className="text-red-500 text-xs">Atleast 2 sub images is required</h6>
                                    }
                                </div>
                                <div className="bg-white p-5 rounded-lg mb-5 text-start">
                                    <h1 className="font-bold mb-2">Product Attributes</h1>
                                    <div className='flex items-start justify-between gap-4'>
                                        <div className='w-full flex flex-col items-start justify-center gap-2'>
                                            <h2 className='font-bold opacity-50'>Available Varients</h2>
                                            {!attributes && (<h2>No varients available, Add a new one!</h2>)}
                                            {attributes?.map(({ ram, rom }) => (
                                                <div className='flex items-center justify-center gap-2'>
                                                    <Field type="radio" name='ramAndRom' value={`${ram}GB RAM & ${rom}GB ROM`} />
                                                    <label htmlFor="">{`${ram}GB RAM & ${rom}GB ROM`}</label>
                                                </div>
                                            ))}
                                            <ErrorMessage name="ramAndRom" component="div" className="text-red-500 text-xs text-start" />
                                        </div>
                                        <div className='w-full flex flex-col items-start justify-center'>
                                            <div className='flex flex-col items-start justify-center gap-2' >
                                                <h2 className='font-bold opacity-50'>Add a new Varient</h2>
                                                {attributeError && (<h2 className='text-red-500 text-xs text-start'>{attributeError}</h2>)}
                                                <div className='flex items-center justify-center h-10 bg-blue-gray-50'>
                                                    <input placeholder='RAM' type='number' min={0} value={newRam} onChange={(evt) => setNewRam(evt.target.value)}
                                                        name="ram" className="w-full bg-transparent rounded-md py-2 px-3 text-sm outline-none border border-gray-200"
                                                    />
                                                    <span className='px-2 h-full flex items-center justify-center'>GB</span>
                                                </div>
                                                <div className='flex items-center justify-center h-10 bg-blue-gray-50'>
                                                    <input placeholder='ROM' type='number' min={0} value={newRom} onChange={(evt) => setNewRom(evt.target.value)}
                                                        name="rom" className="w-full bg-transparent rounded-md py-2 px-3 text-sm outline-none border border-gray-200"
                                                    />
                                                    <span className='px-2 h-full flex items-center justify-center'>GB</span>
                                                </div>
                                                <Button type='button' size='sm' variant='gradient' onClick={handleAttributeSubmit}>Save</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-lg mb-5 text-start">
                                    <h1 className="font-bold mb-2">Product Colours</h1>
                                    <div className='flex items-center justify-start gap-6'>
                                        <div className='flex flex-col items-start justify-center'>
                                            <p className="text-sm my-2 font-semibold">Color</p>
                                            <SwatchesPicker onChange={handleColorPicker} />
                                        </div>
                                        <div className="w-40 h-20 block border text-center border-gray-500" style={{ backgroundColor: color ? color : product?.color ? product.color : "#fff" }}>
                                            {(!color && !product?.color) && <h6 className="text-red-500 text-xs">Color is required</h6>}
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div className="lg:w-2/6">
                                <div className="bg-white p-5 rounded-lg mb-5 text-start">
                                    <h1 className="font-bold">Product Pricing</h1>
                                    <p className="text-sm mt-2 font-semibold">Price</p>
                                    <Field
                                        type="number"
                                        name='price'
                                        className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200"
                                    />
                                    <ErrorMessage name="price" component="div" className="text-red-500 text-xs text-start" />

                                    <p className="text-sm mt-2 font-semibold">Discount Price</p>
                                    <Field
                                        type="number"
                                        name='discountPrice'
                                        className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200"
                                    />
                                    <ErrorMessage name="discountPrice" component="div" className="text-red-500 text-xs text-start" />

                                    <p className="text-sm mt-2 font-semibold">Markup</p>
                                    <Field
                                        type="number"
                                        name='markup'
                                        className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200"
                                    />
                                    <ErrorMessage name="markup" component="div" className="text-red-500 text-xs text-start" />


                                </div>
                                <div className="bg-white p-5 rounded-lg mb-5 text-start">
                                    <h1 className="font-bold">Category</h1>
                                    <p className="text-sm mt-2 font-semibold text-gray-700">Product Category</p>
                                    <input
                                        name="category" id="categories" value={categoryAndBrand?.category} disabled
                                        className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200"
                                    />

                                </div>
                                <div className="bg-white p-5 rounded-lg mb-5 text-start">
                                    <h1 className="font-bold">Brand</h1>
                                    <p className="text-sm mt-2 font-semibold text-gray-700">Product Brand</p>
                                    <input
                                        name="brand" id="brands" value={categoryAndBrand?.brand} disabled
                                        className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200"
                                    />
                                </div>
                                <div className="bg-white p-5 rounded-lg mb-5 text-start">
                                    <h1 className="font-bold">Product Status</h1>
                                    <p className="text-sm mt-2 font-semibold text-gray-700">Status</p>
                                    <Field
                                        name="status" id="status" as="select"
                                        className="w-full bg-blue-gray-50 rounded-md mt-2 py-2 px-3 text-sm outline-none border border-gray-200"

                                    >
                                        <option value="publish">publish</option>
                                        <option value="unpublish">unpublish</option>
                                    </Field>
                                    <ErrorMessage name="status" component="div" className="text-red-500 text-xs text-start" />
                                </div>
                            </div>
                        </div>
                    </Form>
                </Formik>
            </div>
        </>
    )
}

export default EditVarient;