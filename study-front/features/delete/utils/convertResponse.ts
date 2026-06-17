import { DeleteResponse } from '../types';

export const convertResponse = (apiResponse: { statusCode: number; data: any }): DeleteResponse => {
  if (apiResponse.statusCode === 200) {
    return {
      success: true,
      message: "Todo deleted successfully",
    };
  }
  return {
    success: false,
    message: `Failed to delete: ${apiResponse.statusCode}`,
  };
};
